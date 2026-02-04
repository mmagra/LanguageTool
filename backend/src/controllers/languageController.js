const { pool } = require('../config/database');

// @desc    Get all languages (System)
// @route   GET /api/system/languages
// @access  Public (or Protected based on need)
exports.getAllLanguages = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM languages WHERE is_active = true ORDER BY name ASC'
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching languages:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all languages (Admin View - includes inactive)
// @route   GET /api/super-admin/languages
// @access  Super Admin
exports.getLanguagesAdmin = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM languages ORDER BY name ASC'
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching admin languages:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add new language
// @route   POST /api/super-admin/languages
// @access  Super Admin
exports.addLanguage = async (req, res) => {
    const { name, code, speech_code, is_active } = req.body;

    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO languages (name, code, speech_code, is_active) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [name, code, speech_code || code, is_active !== undefined ? is_active : true]
        );

        res.status(201).json({
            success: true,
            message: 'Language added successfully',
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ success: false, message: 'Language code or name already exists' });
        }
        console.error('Error adding language:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update language
// @route   PUT /api/super-admin/languages/:id
// @access  Super Admin
exports.updateLanguage = async (req, res) => {
    const { id } = req.params;
    const { name, code, speech_code } = req.body;

    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    try {
        const result = await pool.query(
            `UPDATE languages 
             SET name = $1, code = $2, speech_code = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [name, code, speech_code || code, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        res.json({
            success: true,
            message: 'Language updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'Language code or name already exists' });
        }
        console.error('Error updating language:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle language status
// @route   PATCH /api/super-admin/languages/:id/toggle
// @access  Super Admin
exports.toggleLanguage = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE languages 
             SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        res.json({
            success: true,
            message: `Language ${result.rows[0].is_active ? 'enabled' : 'disabled'}`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error toggling language:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete language
// @route   DELETE /api/super-admin/languages/:id
// @access  Super Admin
exports.deleteLanguage = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM languages WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        res.json({
            success: true,
            message: 'Language deleted successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error deleting language:', err);
        if (err.code === '23503') { // Foreign key violation
            return res.status(400).json({
                success: false,
                message: 'Cannot delete language. It is being used by students or other resources.'
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
