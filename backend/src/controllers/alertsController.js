const { pool } = require('../config/database');

// @desc    Get system alerts for Super Admin
// @route   GET /api/super-admin/alerts
// @access  Super Admin
exports.getAlerts = async (req, res) => {
    try {
        const alerts = [];

        // 1. Expiring Subscriptions (next 30 days)
        const expiringResult = await pool.query(`
            SELECT id, name, valid_until, plan_tier,
                   EXTRACT(DAY FROM (valid_until - CURRENT_TIMESTAMP)) as days_remaining
            FROM schools
            WHERE valid_until IS NOT NULL
                AND valid_until <= CURRENT_TIMESTAMP + INTERVAL '30 days'
                AND valid_until >= CURRENT_TIMESTAMP
                AND status = 'active'
            ORDER BY valid_until ASC
        `);

        expiringResult.rows.forEach(school => {
            const daysRemaining = Math.ceil(parseFloat(school.days_remaining));
            alerts.push({
                type: 'expiring_subscription',
                severity: daysRemaining <= 7 ? 'critical' : daysRemaining <= 14 ? 'warning' : 'info',
                title: `Subscription Expiring Soon`,
                message: `${school.name}'s ${school.plan_tier} plan expires in ${daysRemaining} days`,
                school_id: school.id,
                school_name: school.name,
                days_remaining: daysRemaining,
                created_at: new Date()
            });
        });

        // 2. High Minutes Usage (>80%)
        const highUsageResult = await pool.query(`
            SELECT id, name, minutes_used, minutes_limit, plan_tier
            FROM schools
            WHERE status = 'active'
                AND minutes_limit > 0
                AND (minutes_used::float / minutes_limit::float) >= 0.8
            ORDER BY (minutes_used::float / minutes_limit::float) DESC
        `);

        highUsageResult.rows.forEach(school => {
            const percentage = ((school.minutes_used / school.minutes_limit) * 100).toFixed(1);
            alerts.push({
                type: 'high_usage',
                severity: percentage >= 95 ? 'critical' : percentage >= 90 ? 'warning' : 'info',
                title: `High Minutes Usage`,
                message: `${school.name} has used ${percentage}% of their minutes (${school.minutes_used}/${school.minutes_limit})`,
                school_id: school.id,
                school_name: school.name,
                usage_percentage: parseFloat(percentage),
                created_at: new Date()
            });
        });

        // 3. Capacity Warnings (>90% students or teachers)
        const capacityResult = await pool.query(`
            SELECT 
                s.id, 
                s.name, 
                s.max_students, 
                s.max_teachers,
                COUNT(CASE WHEN u.role = 'student' AND u.status NOT IN ('pending', 'rejected') THEN 1 END) as student_count,
                COUNT(CASE WHEN u.role = 'teacher' AND u.status NOT IN ('pending', 'rejected') THEN 1 END) as teacher_count
            FROM schools s
            LEFT JOIN users u ON u.school_id = s.id
            WHERE s.status = 'active'
            GROUP BY s.id, s.name, s.max_students, s.max_teachers
            HAVING 
                (COUNT(CASE WHEN u.role = 'student' AND u.status NOT IN ('pending', 'rejected') THEN 1 END)::float / NULLIF(s.max_students, 0)::float) >= 0.9
                OR (COUNT(CASE WHEN u.role = 'teacher' AND u.status NOT IN ('pending', 'rejected') THEN 1 END)::float / NULLIF(s.max_teachers, 0)::float) >= 0.9
        `);

        capacityResult.rows.forEach(school => {
            const studentPercentage = school.max_students > 0 ? ((school.student_count / school.max_students) * 100).toFixed(1) : 0;
            const teacherPercentage = school.max_teachers > 0 ? ((school.teacher_count / school.max_teachers) * 100).toFixed(1) : 0;

            if (studentPercentage >= 90) {
                alerts.push({
                    type: 'capacity_warning',
                    severity: studentPercentage >= 95 ? 'critical' : 'warning',
                    title: `Student Capacity Warning`,
                    message: `${school.name} is at ${studentPercentage}% student capacity (${school.student_count}/${school.max_students})`,
                    school_id: school.id,
                    school_name: school.name,
                    capacity_percentage: parseFloat(studentPercentage),
                    created_at: new Date()
                });
            }

            if (teacherPercentage >= 90) {
                alerts.push({
                    type: 'capacity_warning',
                    severity: teacherPercentage >= 95 ? 'critical' : 'warning',
                    title: `Teacher Capacity Warning`,
                    message: `${school.name} is at ${teacherPercentage}% teacher capacity (${school.teacher_count}/${school.max_teachers})`,
                    school_id: school.id,
                    school_name: school.name,
                    capacity_percentage: parseFloat(teacherPercentage),
                    created_at: new Date()
                });
            }
        });

        // 4. Pending Payments
        const pendingPaymentsResult = await pool.query(`
            SELECT sl.id, sl.amount, sl.payment_date, sl.created_at, s.id as school_id, s.name as school_name
            FROM subscription_logs sl
            JOIN schools s ON s.id = sl.school_id
            WHERE sl.status = 'pending'
                AND sl.payment_date < CURRENT_DATE
            ORDER BY sl.payment_date ASC
        `);

        pendingPaymentsResult.rows.forEach(payment => {
            const daysPending = Math.floor((new Date() - new Date(payment.payment_date)) / (1000 * 60 * 60 * 24));
            alerts.push({
                type: 'pending_payment',
                severity: daysPending > 30 ? 'critical' : daysPending > 14 ? 'warning' : 'info',
                title: `Overdue Payment`,
                message: `${payment.school_name} has a pending payment of $${payment.amount} (${daysPending} days overdue)`,
                school_id: payment.school_id,
                school_name: payment.school_name,
                amount: parseFloat(payment.amount),
                days_pending: daysPending,
                created_at: new Date()
            });
        });

        // Sort alerts by severity and date
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => {
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });

        res.json({
            success: true,
            data: {
                alerts,
                summary: {
                    total: alerts.length,
                    critical: alerts.filter(a => a.severity === 'critical').length,
                    warning: alerts.filter(a => a.severity === 'warning').length,
                    info: alerts.filter(a => a.severity === 'info').length
                }
            }
        });
    } catch (err) {
        console.error('Error fetching alerts:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get audit logs
// @route   GET /api/super-admin/audit-logs
// @access  Super Admin
exports.getAuditLogs = async (req, res) => {
    const { limit = 50, offset = 0, action, resourceType, userId } = req.query;

    try {
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (action) {
            query += ` AND action = $${paramIndex}`;
            params.push(action);
            paramIndex++;
        }

        if (resourceType) {
            query += ` AND resource_type = $${paramIndex}`;
            params.push(resourceType);
            paramIndex++;
        }

        if (userId) {
            query += ` AND user_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM audit_logs WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (action) {
            countQuery += ` AND action = $${countParamIndex}`;
            countParams.push(action);
            countParamIndex++;
        }

        if (resourceType) {
            countQuery += ` AND resource_type = $${countParamIndex}`;
            countParams.push(resourceType);
            countParamIndex++;
        }

        if (userId) {
            countQuery += ` AND user_id = $${countParamIndex}`;
            countParams.push(userId);
            countParamIndex++;
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
