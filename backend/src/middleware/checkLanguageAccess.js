const { pool } = require('../config/database');

/**
 * Middleware to check if the requested language (in body) is allowed for the user's school.
 * Expects `preferred_language` or `language_code` in req.body.
 */
const checkLanguageAccess = async (req, res, next) => {
    // 1. Skip for Super Admins
    if (req.user.is_super_admin) {
        return next();
    }

    // 2. Identify the language being requested
    // We check for common field names
    const languageName = req.body.preferred_language || req.body.language;

    // If no language is being set/updated, skip check
    if (!languageName) {
        return next();
    }

    // 3. Get User's School Allowed Languages
    if (!req.user.school_id) {
        return res.status(403).json({ success: false, message: 'No school context found.' });
    }

    try {
        // Determine the target language code first
        let targetCode = req.body.preferred_language || req.body.language; // Start with input

        // Attempt to find the language in the DB to get the normalized code
        const langResult = await pool.query(
            `SELECT id, code, name FROM languages WHERE name ILIKE $1 OR code ILIKE $1`,
            [targetCode]
        );

        if (langResult.rows.length === 0) {
            // If we can't identify the language, we can't check perms. 
            // Depending on strictness, we might block or pass. 
            // For now, if we can't find it in our system, assume it's invalid.
            return res.status(400).json({ success: false, message: `Invalid language: ${targetCode}` });
        }

        const languageData = langResult.rows[0];

        // CHECK PERMISSION: Does this school have this language?
        const permissionResult = await pool.query(
            `SELECT 1 FROM school_languages 
             WHERE school_id = $1 AND language_id = $2`,
            [req.user.school_id, languageData.id]
        );

        if (permissionResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: `The language '${languageData.name}' is not enabled for your school.`
            });
        }

        // normalize the body to use the correct code if needed?
        // req.body.preferred_language = languageData.code; // Optional side effect to normalize input

        next();

        next();

    } catch (err) {
        console.error('Error in checkLanguageAccess:', err);
        return res.status(500).json({ success: false, message: 'Server error checking language access.' });
    }
};

module.exports = checkLanguageAccess;
