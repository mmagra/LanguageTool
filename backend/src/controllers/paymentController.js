const { pool } = require('../config/database');

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
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Valid amount is required' });
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

        // Update school validity
        await updateSchoolValidity(id);

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
    const { paymentId } = req.params;
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
            WHERE id = $8
            RETURNING *
        `, [amount, payment_date, payment_method, status, billing_period_start, billing_period_end, notes, paymentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Update school validity
        if (result.rows[0]) {
            await updateSchoolValidity(result.rows[0].school_id);
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
    const { paymentId } = req.params;

    try {
        const result = await pool.query('DELETE FROM subscription_logs WHERE id = $1 RETURNING *', [paymentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Update school validity
        if (result.rows[0]) {
            await updateSchoolValidity(result.rows[0].school_id);
        }

        res.json({
            success: true,
            message: 'Payment deleted successfully'
        });
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

// Helper function to update school validity based on latest paid subscription
const updateSchoolValidity = async (schoolId) => {
    try {
        await pool.query(`
            UPDATE schools 
            SET valid_until = (
                SELECT MAX(billing_period_end)
                FROM subscription_logs
                WHERE school_id = $1 AND status = 'paid'
            )
            WHERE id = $1
        `, [schoolId]);
    } catch (err) {
        console.error('Error updating school validity:', err);
    }
};

