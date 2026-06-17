const { pool } = require('../config/database');
const { ROLES } = require('../utils/constants');

const requireSchoolActive = async (req, res, next) => {
    if (req.user.is_super_admin || req.user.role === ROLES.SUPER_ADMIN) {
        return next();
    }

    // 2. If user has no school (and not super admin), they shouldn't technically exist in this SaaS model,
    // but we'll soft-block them or let them pass if it's a "public" system route.
    // However, for protected routes, strict mode:
    if (!req.user.school_id) {
        return res.status(403).json({ success: false, message: 'No school associated with this account.' });
    }

    try {
        // 3. Check school status
        // We could cache this, but for now, simple DB query.
        const result = await pool.query(
            'SELECT status FROM schools WHERE id = $1',
            [req.user.school_id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'School not found.' });
        }

        const school = result.rows[0];

        if (school.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your school account is currently inactive. Please contact support.'
            });
        }

        next();
    } catch (err) {
        console.error('Error in requireSchoolActive:', err);
        return res.status(500).json({ success: false, message: 'Server error checking school status.' });
    }
};

module.exports = requireSchoolActive;
