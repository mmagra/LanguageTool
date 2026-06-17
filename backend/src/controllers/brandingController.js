const { pool } = require('../config/database');

// @desc    Get current user's school branding
// @route   GET /api/system/branding
// @access  Protected
exports.getMySchoolBranding = async (req, res) => {
    try {
        // If super admin, return system default
        if (req.user.role === 'super admin' || req.user.is_super_admin) {
            return res.json({
                success: true,
                data: {
                    name: 'Spoken Edge Super Admin',
                    logo_url: null, // Use default
                    is_system_default: true,
                    allowed_languages: [], // Super admin has access to all generally
                    premium_translation: false,
                    premium_tts: false
                }
            });
        }

        if (!req.user.school_id) {
            return res.status(404).json({ success: false, message: 'No school assigned' });
        }

        // Get school details
        const schoolResult = await pool.query(
            'SELECT id, name, logo_url, plan_tier, features FROM schools WHERE id = $1',
            [req.user.school_id]
        );

        if (schoolResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const schoolData = schoolResult.rows[0];

        // Surface the per-school premium API entitlements (flattened for the client)
        schoolData.premium_translation = schoolData.features?.premium_translation === true;
        schoolData.premium_tts = schoolData.features?.premium_tts === true;
        delete schoolData.features; // don't leak the full features blob

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
