const { pool } = require('../config/database');
const { ROLES } = require('../utils/constants');

const requireSchoolValid = async (req, res, next) => {
    if (req.user.is_super_admin || req.user.role === ROLES.SUPER_ADMIN) {
        return next();
    }

    if (!req.user.school_id) {
        return next();
    }

    try {
        const result = await pool.query(
            'SELECT valid_until, free_access FROM schools WHERE id = $1',
            [req.user.school_id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'School not found.' });
        }

        const { valid_until, free_access } = result.rows[0];

        // Super-admin comp: full access with no payment required.
        if (free_access) {
            return next();
        }

        // A school must have an active (future) validity window to use features.
        // NULL  → never activated (no successful payment yet) → blocked.
        // past  → subscription lapsed → blocked.
        if (!valid_until || new Date(valid_until) < new Date()) {
            return res.status(403).json({
                success: false,
                code: 'SUBSCRIPTION_INACTIVE',
                message: !valid_until
                    ? 'Your school subscription is not active yet. Please complete payment to activate your account.'
                    : 'Your school subscription has expired. Please contact your administrator.'
            });
        }

        next();
    } catch (err) {
        console.error('Error in requireSchoolValid:', err);
        return res.status(500).json({ success: false, message: 'Server error checking school validity.' });
    }
};

module.exports = requireSchoolValid;
