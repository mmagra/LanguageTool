const { pool } = require('../config/database');
const { logAction } = require('./auditController');

// @desc    Get all payments for a specific school
// @route   GET /api/super-admin/schools/:id/payments
// @access  Super Admin
exports.getSchoolPayments = async (req, res) => {
    const { id } = req.params;
    const { status, startDate, endDate } = req.query;

    try {
        let query = 'SELECT * FROM subscription_logs WHERE school_id = $1';
        const params = [id];
        let paramIndex = 2;

        // Add status filter
        if (status && status !== 'all') {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Add date range filter
        if (startDate) {
            query += ` AND payment_date >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            query += ` AND payment_date <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        query += ' ORDER BY payment_date DESC';

        const result = await pool.query(query, params);

        // Calculate total revenue
        const totalRevenue = result.rows
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        res.json({
            success: true,
            data: result.rows,
            totalRevenue: totalRevenue.toFixed(2)
        });
    } catch (err) {
        console.error('Error fetching school payments:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get the logged-in school admin's own payment history
// @route   GET /api/my-school/payments
// @access  School Admin (scoped to their own school)
exports.getMyPayments = async (req, res) => {
    const schoolId = req.user.school_id;
    if (!schoolId) {
        return res.status(404).json({ success: false, message: 'No school associated with this account' });
    }
    try {
        const result = await pool.query(
            'SELECT * FROM subscription_logs WHERE school_id = $1 ORDER BY payment_date DESC',
            [schoolId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching my payments:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new payment record
// @route   POST /api/super-admin/schools/:id/payments
// @access  Super Admin
exports.createPayment = async (req, res) => {
    const { id } = req.params;
    const {
        amount,
        payment_date,
        payment_method = 'manual',
        status = 'pending',
        billing_period_start,
        billing_period_end,
        notes
    } = req.body;

    // Validation
    if (amount === undefined || amount === null || Number(amount) < 0) {
        return res.status(400).json({ success: false, message: 'Valid amount is required (must be >= 0)' });
    }
    if (!payment_date) {
        return res.status(400).json({ success: false, message: 'Payment date is required' });
    }

    try {
        // Auto-generate invoice number
        const invoice_number = `INV-${id}-${Date.now()}`;

        const result = await pool.query(`
            INSERT INTO subscription_logs 
            (school_id, amount, payment_date, payment_method, status, invoice_number, 
             billing_period_start, billing_period_end, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING *
        `, [
            id,
            amount,
            payment_date,
            payment_method,
            status,
            invoice_number,
            billing_period_start || null,
            billing_period_end || null,
            notes || null
        ]);

        // A new PAID period starts a fresh allowance → recalc validity + reset usage meters.
        // For non-paid records, just recalc validity (meters untouched).
        if (status === 'paid') {
            await recordPaidPeriod(id);
        } else {
            await updateSchoolValidity(id);
        }

        try {
            logAction(req.user.id, req.user.email, 'CREATE_PAYMENT', 'payment', result.rows[0].id, {
                school_id: id, amount, status, invoice_number: result.rows[0].invoice_number
            }, req);
        } catch (e) { console.error('Audit log error', e); }

        res.status(201).json({
            success: true,
            message: 'Payment record created successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating payment:', err);
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'Invoice number already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update payment record
// @route   PUT /api/super-admin/schools/:id/payments/:paymentId
// @access  Super Admin
exports.updatePayment = async (req, res) => {
    const { id: schoolId, paymentId } = req.params;
    const {
        amount,
        payment_date,
        payment_method,
        status,
        billing_period_start,
        billing_period_end,
        notes
    } = req.body;

    try {
        const result = await pool.query(`
            UPDATE subscription_logs 
            SET amount = COALESCE($1, amount),
                payment_date = COALESCE($2, payment_date),
                payment_method = COALESCE($3, payment_method),
                status = COALESCE($4, status),
                billing_period_start = COALESCE($5, billing_period_start),
                billing_period_end = COALESCE($6, billing_period_end),
                notes = COALESCE($7, notes),
                updated_at = NOW()
            WHERE id = $8 AND school_id = $9
            RETURNING *
        `, [amount, payment_date, payment_method, status, billing_period_start, billing_period_end, notes, paymentId, schoolId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found for this school' });
        }

        if (result.rows[0]) {
            await updateSchoolValidity(result.rows[0].school_id);
            try {
                logAction(req.user.id, req.user.email, 'UPDATE_PAYMENT', 'payment', paymentId, {
                    school_id: result.rows[0].school_id, status
                }, req);
            } catch (e) { console.error('Audit log error', e); }
        }

        res.json({
            success: true,
            message: 'Payment updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete payment record
// @route   DELETE /api/super-admin/schools/:id/payments/:paymentId
// @access  Super Admin
exports.deletePayment = async (req, res) => {
    const { id: schoolId, paymentId } = req.params;

    try {
        const result = await pool.query('DELETE FROM subscription_logs WHERE id = $1 AND school_id = $2 RETURNING *', [paymentId, schoolId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found for this school' });
        }

        if (result.rows[0]) {
            await updateSchoolValidity(result.rows[0].school_id);
            try {
                logAction(req.user.id, req.user.email, 'DELETE_PAYMENT', 'payment', paymentId, {
                    school_id: result.rows[0].school_id
                }, req);
            } catch (e) { console.error('Audit log error', e); }
        }

        res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (err) {
        console.error('Error deleting payment:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get payment summary across all schools
// @route   GET /api/super-admin/payments/summary
// @access  Super Admin
exports.getPaymentsSummary = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_amount,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
            FROM subscription_logs
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching payments summary:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Billing overview for the super-admin revenue dashboard
// @route   GET /api/super-admin/billing/overview
// @access  Super Admin
exports.getBillingOverview = async (req, res) => {
    try {
        // MRR + subscription status breakdown (from schools)
        const subsResult = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN subscription_status = 'active' AND free_access = false THEN monthly_price ELSE 0 END), 0) AS mrr,
                COUNT(CASE WHEN subscription_status = 'active' THEN 1 END)::int   AS active_count,
                COUNT(CASE WHEN subscription_status = 'past_due' THEN 1 END)::int AS past_due_count,
                COUNT(CASE WHEN subscription_status = 'canceled' THEN 1 END)::int AS canceled_count,
                COUNT(CASE WHEN subscription_status = 'trialing' THEN 1 END)::int AS trialing_count,
                COUNT(CASE WHEN subscription_status IS NULL OR subscription_status = 'none' THEN 1 END)::int AS none_count
            FROM schools
        `);

        // Schools renewing within the next 30 days
        const renewalsResult = await pool.query(`
            SELECT id, name, next_renewal_at, monthly_price, subscription_status
            FROM schools
            WHERE next_renewal_at IS NOT NULL
              AND next_renewal_at >= NOW()
              AND next_renewal_at <= NOW() + INTERVAL '30 days'
            ORDER BY next_renewal_at ASC
        `);

        // Past-due schools (need attention)
        const pastDueResult = await pool.query(`
            SELECT id, name, monthly_price, next_renewal_at
            FROM schools
            WHERE subscription_status = 'past_due'
            ORDER BY next_renewal_at ASC NULLS LAST
        `);

        // Revenue totals (all-time + current month) from logged payments
        const revenueResult = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue,
                COALESCE(SUM(CASE WHEN status = 'paid' AND payment_date >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS month_revenue,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount,
                COUNT(CASE WHEN status = 'failed' THEN 1 END)::int AS failed_count
            FROM subscription_logs
        `);

        const subs = subsResult.rows[0];
        const rev = revenueResult.rows[0];

        res.json({
            success: true,
            data: {
                mrr: parseFloat(subs.mrr) || 0,
                subscriptions: {
                    active: subs.active_count,
                    past_due: subs.past_due_count,
                    canceled: subs.canceled_count,
                    trialing: subs.trialing_count,
                    none: subs.none_count
                },
                upcoming_renewals: renewalsResult.rows,
                past_due: pastDueResult.rows,
                revenue: {
                    total: parseFloat(rev.total_revenue) || 0,
                    this_month: parseFloat(rev.month_revenue) || 0,
                    pending: parseFloat(rev.pending_amount) || 0,
                    failed_count: rev.failed_count
                }
            }
        });
    } catch (err) {
        console.error('Error fetching billing overview:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Download invoice PDF for a payment
// @route   GET /api/super-admin/schools/:id/payments/:paymentId/invoice
// @access  Super Admin
exports.downloadInvoice = async (req, res) => {
    const { id, paymentId } = req.params;

    try {
        // Get payment details
        const paymentResult = await pool.query(
            'SELECT * FROM subscription_logs WHERE id = $1 AND school_id = $2',
            [paymentId, id]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Get school details
        const schoolResult = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);

        if (schoolResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const payment = paymentResult.rows[0];
        const school = schoolResult.rows[0];

        // Generate invoice
        const { generateInvoice } = require('../utils/invoiceGenerator');
        const filepath = await generateInvoice(payment, school);

        // Send PDF file
        res.download(filepath, `${payment.invoice_number}.pdf`, (err) => {
            if (err) {
                console.error('Error sending invoice:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading invoice' });
                }
            }
        });

    } catch (err) {
        console.error('Error generating invoice:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateSchoolValidity = async (schoolId) => {
    try {
        await pool.query(`
            UPDATE schools
            SET valid_until = (
                SELECT MAX(billing_period_end)
                FROM subscription_logs
                WHERE school_id = $1 AND status = 'paid' AND billing_period_end >= CURRENT_DATE
            )
            WHERE id = $1
        `, [schoolId]);
    } catch (err) {
        console.error('Error updating school validity:', err);
    }
};

// Snapshot current usage into school_usage_history then reset counters to 0.
// periodType: 'paid' | 'trial' | 'free' | 'manual'
const snapshotAndResetUsage = async (schoolId, periodType) => {
    try {
        const { rows } = await pool.query(
            `SELECT minutes_used, minutes_limit,
                    translation_chars_used, translation_chars_limit,
                    tts_chars_used, tts_chars_limit,
                    COALESCE(current_period_start, created_at) AS period_start
             FROM schools WHERE id = $1`,
            [schoolId]
        );
        if (!rows[0]) return;
        const s = rows[0];

        await pool.query(
            `INSERT INTO school_usage_history
             (school_id, period_type, period_start, period_end,
              minutes_used, minutes_limit,
              translation_chars_used, translation_chars_limit,
              tts_chars_used, tts_chars_limit)
             VALUES ($1,$2,$3,NOW(),$4,$5,$6,$7,$8,$9)`,
            [
                schoolId, periodType, s.period_start,
                s.minutes_used, s.minutes_limit,
                s.translation_chars_used, s.translation_chars_limit,
                s.tts_chars_used, s.tts_chars_limit,
            ]
        );

        await pool.query(
            `UPDATE schools
             SET minutes_used = 0, translation_chars_used = 0, tts_chars_used = 0,
                 current_period_start = NOW()
             WHERE id = $1`,
            [schoolId]
        );
    } catch (err) {
        console.error('snapshotAndResetUsage failed:', err.message);
    }
};

// A new PAID period started (manual payment OR Stripe invoice.paid):
// recalc validity from paid periods and reset usage meters to a fresh allowance.
// Single source of truth shared by createPayment and the Stripe webhook.
const recordPaidPeriod = async (schoolId) => {
    await updateSchoolValidity(schoolId);
    await snapshotAndResetUsage(schoolId, 'paid');
};

exports.recordPaidPeriod = recordPaidPeriod;
exports.snapshotAndResetUsage = snapshotAndResetUsage;
exports.updateSchoolValidity = updateSchoolValidity;

