const { pool } = require('../config/database');

// @desc    Get current user's school branding
// @route   GET /api/system/branding
// @access  Protected
exports.getMySchoolBranding = async (req, res) => {
    try {
        // If super admin, return system default
        if (req.user.is_super_admin) {
            return res.json({
                success: true,
                data: {
                    name: 'Spokene Super Admin',
                    logo_url: null, // Use default
                    is_system_default: true,
                    allowed_languages: [] // Super admin has access to all generally
                }
            });
        }

        if (!req.user.school_id) {
            return res.status(404).json({ success: false, message: 'No school assigned' });
        }

        // Get school details
        const schoolResult = await pool.query(
            'SELECT id, name, logo_url, plan_tier FROM schools WHERE id = $1',
            [req.user.school_id]
        );

        if (schoolResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const schoolData = schoolResult.rows[0];

        // Get allowed languages
        const languagesResult = await pool.query(
            `SELECT l.code 
             FROM school_languages sl
             JOIN languages l ON sl.language_id = l.id
             WHERE sl.school_id = $1`,
            [req.user.school_id]
        );

        schoolData.allowed_languages = languagesResult.rows.map(row => row.code);

        res.json({
            success: true,
            data: schoolData
        });
    } catch (err) {
        console.error('Error fetching branding:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
