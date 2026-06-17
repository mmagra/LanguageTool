const stripe = require('../config/stripe');
const config = require('../config/config');
const { pool } = require('../config/database');
const { recordPaidPeriod } = require('./paymentController');

// Convert a Stripe unix timestamp (seconds) to a JS Date, or null.
const tsToDate = (unix) => (unix ? new Date(unix * 1000) : null);

// Find the school tied to a Stripe object, preferring explicit metadata,
// then subscription id, then customer id.
const findSchoolId = async ({ metadataSchoolId, subscriptionId, customerId }) => {
    if (metadataSchoolId) return parseInt(metadataSchoolId, 10);
    if (subscriptionId) {
        const r = await pool.query('SELECT id FROM schools WHERE stripe_subscription_id = $1', [subscriptionId]);
        if (r.rows[0]) return r.rows[0].id;
    }
    if (customerId) {
        const r = await pool.query('SELECT id FROM schools WHERE stripe_customer_id = $1', [customerId]);
        if (r.rows[0]) return r.rows[0].id;
    }
    return null;
};

// --- Individual event handlers -------------------------------------------

const handleCheckoutCompleted = async (session) => {
    const schoolId = await findSchoolId({
        metadataSchoolId: session.metadata?.school_id,
        customerId: session.customer
    });
    if (!schoolId) {
        console.error('checkout.session.completed: no school matched', session.id);
        return;
    }
    await pool.query(
        `UPDATE schools
         SET stripe_subscription_id = $1, stripe_customer_id = $2, subscription_status = 'active'
         WHERE id = $3`,
        [session.subscription, session.customer, schoolId]
    );
};

const handleInvoicePaid = async (invoice) => {
    // Idempotency: Stripe retries webhooks. Skip if we've already logged this invoice.
    if (invoice.id) {
        const dup = await pool.query('SELECT id FROM subscription_logs WHERE stripe_invoice_id = $1', [invoice.id]);
        if (dup.rows.length > 0) return;
    }

    const schoolId = await findSchoolId({
        metadataSchoolId: invoice.subscription_details?.metadata?.school_id,
        subscriptionId: invoice.subscription,
        customerId: invoice.customer
    });
    if (!schoolId) {
        console.error('invoice.paid: no school matched', invoice.id);
        return;
    }

    const line = invoice.lines?.data?.[0];
    const periodStart = tsToDate(line?.period?.start || invoice.period_start);
    const periodEnd = tsToDate(line?.period?.end || invoice.period_end);
    const paidAt = tsToDate(invoice.status_transitions?.paid_at) || new Date();
    const amount = (invoice.amount_paid || 0) / 100;
    const invoiceNumber = invoice.number || `STRIPE-${invoice.id}`;

    await pool.query(
        `INSERT INTO subscription_logs
         (school_id, amount, payment_date, payment_method, status, invoice_number,
          invoice_url, billing_period_start, billing_period_end, notes,
          stripe_invoice_id, stripe_subscription_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'stripe', 'paid', $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         ON CONFLICT (invoice_number) DO NOTHING`,
        [
            schoolId,
            amount,
            paidAt,
            invoiceNumber,
            invoice.hosted_invoice_url || null,
            periodStart,
            periodEnd,
            'Stripe automatic payment',
            invoice.id,
            invoice.subscription || null
        ]
    );

    // Fresh paid period → reset usage meters + recalc valid_until (shared helper).
    await recordPaidPeriod(schoolId);

    await pool.query(
        `UPDATE schools SET subscription_status = 'active', next_renewal_at = $1 WHERE id = $2`,
        [periodEnd, schoolId]
    );
};

const handleInvoiceFailed = async (invoice) => {
    const schoolId = await findSchoolId({
        subscriptionId: invoice.subscription,
        customerId: invoice.customer
    });
    if (!schoolId) return;

    const invoiceNumber = invoice.number || `STRIPE-FAIL-${invoice.id}`;
    const amount = (invoice.amount_due || 0) / 100;

    await pool.query(
        `INSERT INTO subscription_logs
         (school_id, amount, payment_date, payment_method, status, invoice_number,
          invoice_url, notes, stripe_invoice_id, stripe_subscription_id, created_at, updated_at)
         VALUES ($1, $2, NOW(), 'stripe', 'failed', $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (invoice_number) DO NOTHING`,
        [
            schoolId, amount, invoiceNumber,
            invoice.hosted_invoice_url || null,
            'Stripe payment failed',
            invoice.id, invoice.subscription || null
        ]
    );

    await pool.query(`UPDATE schools SET subscription_status = 'past_due' WHERE id = $1`, [schoolId]);
};

const handleSubscriptionDeleted = async (subscription) => {
    const schoolId = await findSchoolId({
        metadataSchoolId: subscription.metadata?.school_id,
        subscriptionId: subscription.id,
        customerId: subscription.customer
    });
    if (!schoolId) return;
    await pool.query(`UPDATE schools SET subscription_status = 'canceled' WHERE id = $1`, [schoolId]);
};

// Map a Stripe subscription status to our internal subscription_status values.
const mapStripeStatus = (stripeStatus) => {
    switch (stripeStatus) {
        case 'active': return 'active';
        case 'trialing': return 'trialing';
        case 'past_due':
        case 'unpaid': return 'past_due';
        case 'canceled':
        case 'incomplete_expired': return 'canceled';
        default: return 'past_due';
    }
};

// Keep our DB in sync when Stripe changes a subscription outside our app
// (past-due → active recovery, card update, cancellation reversal, Dashboard edits).
const handleSubscriptionUpdated = async (subscription) => {
    const schoolId = await findSchoolId({
        metadataSchoolId: subscription.metadata?.school_id,
        subscriptionId: subscription.id,
        customerId: subscription.customer
    });
    if (!schoolId) return;

    const status = mapStripeStatus(subscription.status);
    const nextRenewal = tsToDate(subscription.current_period_end);
    await pool.query(
        `UPDATE schools SET subscription_status = $1, next_renewal_at = COALESCE($2, next_renewal_at) WHERE id = $3`,
        [status, nextRenewal, schoolId]
    );
};

// @desc    Stripe webhook receiver (raw body, signature-verified)
// @route   POST /api/stripe/webhook   (mounted in app.js BEFORE express.json)
// @access  Public (verified by signature)
exports.handleStripeWebhook = async (req, res) => {
    if (!stripe || !config.stripe.webhookSecret) {
        return res.status(503).send('Stripe not configured');
    }

    let event;
    try {
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    } catch (err) {
        console.error('⚠️  Stripe webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
            case 'invoice.paid':
            case 'invoice.payment_succeeded':
                await handleInvoicePaid(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handleInvoiceFailed(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            default:
                // Unhandled event types are acknowledged but ignored.
                break;
        }
    } catch (err) {
        console.error(`Error handling Stripe event ${event.type}:`, err);
        // Return 500 so Stripe retries — but signature already verified, so this is safe.
        return res.status(500).send('Webhook handler error');
    }

    res.json({ received: true });
};
