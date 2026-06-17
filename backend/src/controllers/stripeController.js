const crypto = require('crypto');
const stripe = require('../config/stripe');
const config = require('../config/config');
const { pool } = require('../config/database');
const { logAction } = require('./auditController');
const { sendEmail } = require('../utils/emailService');

// Guard: every endpoint needs a configured Stripe client.
const ensureStripe = (res) => {
    if (!stripe) {
        res.status(503).json({ success: false, message: 'Stripe billing is not configured on this server.' });
        return false;
    }
    return true;
};

// --- Short payment links -------------------------------------------------
// Unambiguous base-32 alphabet (no 0/o/1/l) for readable codes.
const SHORT_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const genShortCode = (len = 6) => {
    const bytes = crypto.randomBytes(len);
    let out = '';
    for (let i = 0; i < len; i++) out += SHORT_ALPHABET[bytes[i] % SHORT_ALPHABET.length];
    return out;
};

// Persist a short code → long Stripe URL, retrying on the rare code collision.
const createShortLink = async (schoolId, targetUrl) => {
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = genShortCode(6);
        try {
            await pool.query(
                'INSERT INTO payment_links (code, school_id, target_url) VALUES ($1, $2, $3)',
                [code, schoolId, targetUrl]
            );
            return code;
        } catch (e) {
            if (e.code === '23505') continue; // unique collision → try another code
            throw e;
        }
    }
    throw new Error('Could not generate a unique short link');
};

// Build the public short URL from the incoming request host (proxy-aware).
const buildShortUrl = (req, code) => {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    return `${proto}://${req.get('host')}/pay/${code}`;
};

// @desc    Resolve a short link and redirect to the Stripe Checkout page
// @route   GET /pay/:code   (public, mounted in app.js)
// @access  Public
exports.redirectShortLink = async (req, res) => {
    try {
        const r = await pool.query('SELECT target_url FROM payment_links WHERE code = $1', [req.params.code]);
        if (!r.rows[0]) {
            return res.status(404).send('Payment link not found or expired.');
        }
        return res.redirect(302, r.rows[0].target_url);
    } catch (e) {
        console.error('Short link redirect error:', e.message);
        return res.status(500).send('Error resolving payment link.');
    }
};

// Ensure the school has a Stripe Customer; create + persist one if missing.
const ensureCustomer = async (school) => {
    if (school.stripe_customer_id) return school.stripe_customer_id;

    const customer = await stripe.customers.create({
        name: school.name,
        email: school.contact_email || undefined,
        metadata: { school_id: String(school.id) }
    });

    await pool.query('UPDATE schools SET stripe_customer_id = $1 WHERE id = $2', [customer.id, school.id]);
    return customer.id;
};

// Ensure there's a recurring monthly Price matching the school's agreed amount.
// Stripe Prices are immutable, so we create a fresh one whenever the amount changes.
const ensureRecurringPrice = async (school, amountCents) => {
    if (school.stripe_price_id) {
        try {
            const existing = await stripe.prices.retrieve(school.stripe_price_id);
            if (existing && existing.active && existing.unit_amount === amountCents && existing.recurring?.interval === 'month') {
                return existing.id;
            }
        } catch (_) { /* fall through and create a new price */ }
    }

    const price = await stripe.prices.create({
        unit_amount: amountCents,
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: { name: `${school.name} — ${school.plan_tier || 'custom'} plan (monthly)` },
        metadata: { school_id: String(school.id) }
    });

    await pool.query('UPDATE schools SET stripe_price_id = $1 WHERE id = $2', [price.id, school.id]);
    return price.id;
};

// @desc    Create a Stripe Checkout Session (subscription mode) for a school
// @route   POST /api/super-admin/schools/:id/subscription/checkout
// @access  Super Admin
exports.createCheckoutSession = async (req, res) => {
    if (!ensureStripe(res)) return;
    const { id } = req.params;
    const { email } = req.body || {}; // optional: also email the link to the school

    try {
        const schoolRes = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);
        if (schoolRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        const school = schoolRes.rows[0];

        const amount = parseFloat(school.monthly_price);
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Set a monthly price for this school before starting a subscription.'
            });
        }
        const amountCents = Math.round(amount * 100);

        const customerId = await ensureCustomer(school);
        const priceId = await ensureRecurringPrice({ ...school, stripe_customer_id: customerId }, amountCents);

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${config.frontendUrl}/super-admin/schools/${id}?billing=success`,
            cancel_url: `${config.frontendUrl}/super-admin/schools/${id}?billing=cancel`,
            metadata: { school_id: String(id) },
            subscription_data: { metadata: { school_id: String(id) } }
        });

        // Wrap the long Stripe URL in a short, shareable link.
        let shortUrl = session.url;
        try {
            const code = await createShortLink(id, session.url);
            shortUrl = buildShortUrl(req, code);
        } catch (linkErr) {
            // Most common cause: the payment_links table doesn't exist yet (backend not
            // restarted after the feature shipped). Log the full error so it's diagnosable.
            console.error('Failed to create short link, falling back to full Stripe URL:', linkErr);
            if (linkErr.code === '42P01') {
                console.error('→ The "payment_links" table is missing. Restart the backend so runMigrations() creates it.');
            }
        }

        // Optionally email the checkout link to the school contact.
        const recipient = email || school.contact_email;
        if (recipient) {
            try {
                await sendEmail({
                    to: recipient,
                    subject: `Set up billing for ${school.name}`,
                    html: `
                        <h2>Complete your subscription</h2>
                        <p>Please add a payment method to activate billing for <strong>${school.name}</strong>.</p>
                        <p>Plan: <strong>${school.plan_tier || 'custom'}</strong> — <strong>$${amount.toFixed(2)}/mo</strong></p>
                        <p><a href="${shortUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Set up payment</a></p>
                        <p>This is a secure payment page.</p>
                    `
                });
            } catch (mailErr) {
                console.error('Failed to email checkout link:', mailErr.message);
                // Non-fatal: the super admin can still copy the link from the response.
            }
        }

        try {
            logAction(req.user.id, req.user.email, 'CREATE_CHECKOUT_SESSION', 'school', id, {
                amount, emailed: !!recipient
            }, req);
        } catch (e) { console.error('Audit log error', e); }

        res.json({ success: true, data: { url: shortUrl, emailed: !!recipient } });
    } catch (err) {
        console.error('Error creating checkout session:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// @desc    School admin self-checkout for their OWN school (price set by super admin)
// @route   POST /api/my-school/subscription/checkout
// @access  School Admin
exports.createMyCheckoutSession = async (req, res) => {
    if (!ensureStripe(res)) return;
    const schoolId = req.user.school_id;
    if (!schoolId) {
        return res.status(404).json({ success: false, message: 'No school associated with this account.' });
    }

    try {
        const schoolRes = await pool.query('SELECT * FROM schools WHERE id = $1', [schoolId]);
        if (schoolRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        const school = schoolRes.rows[0];

        const amount = parseFloat(school.monthly_price);
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No price has been set for your school yet. Please contact your administrator.'
            });
        }
        const amountCents = Math.round(amount * 100);

        const customerId = await ensureCustomer(school);
        const priceId = await ensureRecurringPrice({ ...school, stripe_customer_id: customerId }, amountCents);

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${config.frontendUrl}/admin/billing?billing=success`,
            cancel_url: `${config.frontendUrl}/admin/billing?billing=cancel`,
            metadata: { school_id: String(schoolId) },
            subscription_data: { metadata: { school_id: String(schoolId) } }
        });

        let shortUrl = session.url;
        try {
            const code = await createShortLink(schoolId, session.url);
            shortUrl = buildShortUrl(req, code);
        } catch (linkErr) {
            console.error('Failed to create short link (my-checkout), using full URL:', linkErr);
        }

        res.json({ success: true, data: { url: shortUrl, amount } });
    } catch (err) {
        console.error('Error creating self-checkout session:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// @desc    Latest payment link for the admin's own school (the one the super admin
//          generated/emailed) so it can be shown on the Billing page.
// @route   GET /api/my-school/payment-link
// @access  School Admin
exports.getMyPaymentLink = async (req, res) => {
    const schoolId = req.user.school_id;
    if (!schoolId) {
        return res.status(404).json({ success: false, message: 'No school associated with this account.' });
    }
    try {
        const r = await pool.query(
            'SELECT code FROM payment_links WHERE school_id = $1 ORDER BY created_at DESC LIMIT 1',
            [schoolId]
        );
        const url = r.rows[0] ? buildShortUrl(req, r.rows[0].code) : null;
        res.json({ success: true, data: { url } });
    } catch (err) {
        console.error('Error fetching my payment link:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get a school's subscription status + card on file
// @route   GET /api/super-admin/schools/:id/subscription
// @access  Super Admin
exports.getSubscription = async (req, res) => {
    const { id } = req.params;
    try {
        const schoolRes = await pool.query(
            `SELECT subscription_status, monthly_price, next_renewal_at,
                    stripe_subscription_id, stripe_customer_id
             FROM schools WHERE id = $1`,
            [id]
        );
        if (schoolRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        const school = schoolRes.rows[0];

        let cardLast4 = null;
        let cardBrand = null;
        let cancelAtPeriodEnd = false;
        if (stripe && school.stripe_subscription_id) {
            try {
                const sub = await stripe.subscriptions.retrieve(school.stripe_subscription_id, {
                    expand: ['default_payment_method']
                });
                const pm = sub.default_payment_method;
                if (pm && pm.card) {
                    cardLast4 = pm.card.last4;
                    cardBrand = pm.card.brand;
                }
                cancelAtPeriodEnd = sub.cancel_at_period_end === true;
            } catch (e) {
                console.error('Failed to fetch Stripe subscription:', e.message);
            }
        }

        res.json({
            success: true,
            data: {
                subscription_status: school.subscription_status || 'none',
                monthly_price: school.monthly_price,
                next_renewal_at: school.next_renewal_at,
                stripe_subscription_id: school.stripe_subscription_id,
                card_last4: cardLast4,
                card_brand: cardBrand,
                cancel_at_period_end: cancelAtPeriodEnd
            }
        });
    } catch (err) {
        console.error('Error fetching subscription:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Cancel a school's subscription at period end
// @route   POST /api/super-admin/schools/:id/subscription/cancel
// @access  Super Admin
exports.cancelSubscription = async (req, res) => {
    if (!ensureStripe(res)) return;
    const { id } = req.params;
    try {
        const schoolRes = await pool.query('SELECT stripe_subscription_id FROM schools WHERE id = $1', [id]);
        if (schoolRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        const subId = schoolRes.rows[0].stripe_subscription_id;
        if (!subId) {
            return res.status(400).json({ success: false, message: 'No active subscription for this school.' });
        }

        await stripe.subscriptions.update(subId, { cancel_at_period_end: true });

        try {
            logAction(req.user.id, req.user.email, 'CANCEL_SUBSCRIPTION', 'school', id, { subId }, req);
        } catch (e) { console.error('Audit log error', e); }

        res.json({ success: true, message: 'Subscription will cancel at the end of the current period.' });
    } catch (err) {
        console.error('Error cancelling subscription:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// @desc    Undo a scheduled cancellation (keep the subscription active)
// @route   POST /api/super-admin/schools/:id/subscription/resume
// @access  Super Admin
exports.resumeSubscription = async (req, res) => {
    if (!ensureStripe(res)) return;
    const { id } = req.params;
    try {
        const schoolRes = await pool.query('SELECT stripe_subscription_id FROM schools WHERE id = $1', [id]);
        if (schoolRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        const subId = schoolRes.rows[0].stripe_subscription_id;
        if (!subId) {
            return res.status(400).json({ success: false, message: 'No subscription for this school.' });
        }

        await stripe.subscriptions.update(subId, { cancel_at_period_end: false });

        try {
            logAction(req.user.id, req.user.email, 'RESUME_SUBSCRIPTION', 'school', id, { subId }, req);
        } catch (e) { console.error('Audit log error', e); }

        res.json({ success: true, message: 'Subscription will continue renewing.' });
    } catch (err) {
        console.error('Error resuming subscription:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
