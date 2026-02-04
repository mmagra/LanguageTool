const { pool } = require('../config/database');

// @desc    Get analytics overview for Super Admin
// @route   GET /api/super-admin/analytics/overview
// @access  Super Admin
exports.getAnalyticsOverview = async (req, res) => {
    try {
        // Total Revenue
        const revenueResult = await pool.query(`
            SELECT 
                COALESCE(SUM(amount), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_revenue,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_revenue,
                COALESCE(SUM(CASE WHEN DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE) AND status = 'paid' THEN amount ELSE 0 END), 0) as revenue_this_month
            FROM subscription_logs
        `);

        // Monthly Revenue Trend (last 6 months)
        const revenueTrendResult = await pool.query(`
            SELECT 
                TO_CHAR(payment_date, 'Mon YYYY') as month,
                COALESCE(SUM(amount), 0) as revenue
            FROM subscription_logs
            WHERE payment_date >= CURRENT_DATE - INTERVAL '6 months'
                AND status = 'paid'
            GROUP BY TO_CHAR(payment_date, 'Mon YYYY'), DATE_TRUNC('month', payment_date)
            ORDER BY DATE_TRUNC('month', payment_date) ASC
        `);

        // School Statistics
        const schoolStatsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_schools,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_schools,
                COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_schools,
                COUNT(CASE WHEN status = 'trial' THEN 1 END) as trial_schools
            FROM schools
        `);

        // User Statistics
        const userStatsResult = await pool.query(`
            SELECT 
                COUNT(CASE WHEN role = 'student' AND status NOT IN ('pending', 'rejected') THEN 1 END) as total_students,
                COUNT(CASE WHEN role = 'teacher' AND status NOT IN ('pending', 'rejected') THEN 1 END) as total_teachers,
                COUNT(CASE WHEN role = 'admin' AND status NOT IN ('pending', 'rejected') THEN 1 END) as total_admins
            FROM users
        `);

        // Plan Distribution
        const planDistributionResult = await pool.query(`
            SELECT 
                plan_tier,
                COUNT(*) as count
            FROM schools
            WHERE status = 'active'
            GROUP BY plan_tier
            ORDER BY count DESC
        `);

        // Expiring Subscriptions (next 30 days)
        const expiringSchoolsResult = await pool.query(`
            SELECT 
                id,
                name,
                valid_until,
                plan_tier,
                EXTRACT(DAY FROM (valid_until - CURRENT_TIMESTAMP)) as days_remaining
            FROM schools
            WHERE valid_until IS NOT NULL
                AND valid_until <= CURRENT_TIMESTAMP + INTERVAL '30 days'
                AND valid_until >= CURRENT_TIMESTAMP
                AND status = 'active'
            ORDER BY valid_until ASC
            LIMIT 10
        `);

        // Minutes Usage Summary
        const minutesUsageResult = await pool.query(`
            SELECT 
                COALESCE(SUM(minutes_used), 0) as total_minutes_used,
                COALESCE(SUM(minutes_limit), 0) as total_minutes_limit
            FROM schools
            WHERE status = 'active'
        `);

        const minutesUsage = minutesUsageResult.rows[0];
        const minutesPercentage = minutesUsage.total_minutes_limit > 0
            ? ((minutesUsage.total_minutes_used / minutesUsage.total_minutes_limit) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                revenue: {
                    total: parseFloat(revenueResult.rows[0].total_revenue),
                    paid: parseFloat(revenueResult.rows[0].paid_revenue),
                    pending: parseFloat(revenueResult.rows[0].pending_revenue),
                    thisMonth: parseFloat(revenueResult.rows[0].revenue_this_month)
                },
                revenueTrend: revenueTrendResult.rows.map(row => ({
                    month: row.month,
                    revenue: parseFloat(row.revenue)
                })),
                schools: {
                    total: parseInt(schoolStatsResult.rows[0].total_schools),
                    active: parseInt(schoolStatsResult.rows[0].active_schools),
                    suspended: parseInt(schoolStatsResult.rows[0].suspended_schools),
                    trial: parseInt(schoolStatsResult.rows[0].trial_schools)
                },
                users: {
                    students: parseInt(userStatsResult.rows[0].total_students),
                    teachers: parseInt(userStatsResult.rows[0].total_teachers),
                    admins: parseInt(userStatsResult.rows[0].total_admins)
                },
                planDistribution: planDistributionResult.rows.map(row => ({
                    plan: row.plan_tier,
                    count: parseInt(row.count)
                })),
                expiringSchools: expiringSchoolsResult.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    valid_until: row.valid_until,
                    plan_tier: row.plan_tier,
                    days_remaining: Math.ceil(parseFloat(row.days_remaining))
                })),
                minutesUsage: {
                    used: parseInt(minutesUsage.total_minutes_used),
                    limit: parseInt(minutesUsage.total_minutes_limit),
                    percentage: parseFloat(minutesPercentage)
                }
            }
        });
    } catch (err) {
        console.error('Error fetching analytics overview:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
