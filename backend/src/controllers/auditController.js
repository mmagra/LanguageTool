const { pool } = require('../config/database');

// @desc    Get all audit logs with filtering and pagination
// @route   GET /api/super-admin/audit-logs
// @access  Super Admin
exports.getAuditLogs = async (req, res) => {
    const { page = 1, action, resource_type, search, startDate, endDate } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    try {
        let query = `
            SELECT a.*, 
                   u.email as user_email, 
                   u.first_name, 
                   u.last_name,
                   u.role as user_role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        // Filters
        if (action) {
            query += ` AND a.action = $${paramCount}`;
            values.push(action);
            paramCount++;
        }

        if (resource_type) {
            query += ` AND a.resource_type = $${paramCount}`;
            values.push(resource_type);
            paramCount++;
        }

        if (search) {
            query += ` AND (u.email ILIKE $${paramCount} OR a.details::text ILIKE $${paramCount})`;
            values.push(`%${search}%`);
            paramCount++;
        }

        if (startDate) {
            query += ` AND a.created_at >= $${paramCount}`;
            values.push(startDate);
            paramCount++;
        }

        if (endDate) {
            query += ` AND a.created_at < ($${paramCount}::date + interval '1 day')`;
            values.push(endDate);
            paramCount++;
        }

        // Count total for pagination
        const countQueryText = query.replace(/SELECT .* FROM/s, 'SELECT COUNT(*) FROM');
        // Note: The simple replace might break if subqueries logic was complex, but fine here.
        // A safer way for count is usually building conditions separately.

        // Let's rebuild count details properly to avoid regex issues
        let countQuery = `
            SELECT COUNT(*) 
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        // Re-append conditions (using same values array is fine as long as order matches)
        // Actually, just copying the WHERE clause parts is safer.
        // For simplicity/robustness, I will execute the count query with the same values.

        // Re-construct WHERE clauses for consistency
        let whereClause = '';
        let vCount = 1;
        if (action) { whereClause += ` AND a.action = $${vCount++}`; }
        if (resource_type) { whereClause += ` AND a.resource_type = $${vCount++}`; }
        if (search) { whereClause += ` AND (u.email ILIKE $${vCount} OR a.details::text ILIKE $${vCount})`; vCount++; }
        if (startDate) { whereClause += ` AND a.created_at >= $${vCount++}`; }
        if (endDate) { whereClause += ` AND a.created_at < ($${vCount++}::date + interval '1 day')`; }

        const totalResult = await pool.query(countQuery + whereClause, values);
        const total = parseInt(totalResult.rows[0].count);

        // Append Sort and Pagination
        query += ` ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);

        res.json({
            success: true,
            data: {
                logs: result.rows,
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Log an action (Internal helper, or route if needed)
exports.logAction = async (userId, userEmail, action, resourceType, resourceId, details, req) => {
    try {
        const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
        const userAgent = req ? req.headers['user-agent'] : null;

        await pool.query(
            `INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, details, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, userEmail, action, resourceType, resourceId, JSON.stringify(details), ip, userAgent]
        );
    } catch (err) {
        console.error('Audit logging failed:', err);
        // Don't crash the main request if logging fails
    }
};
