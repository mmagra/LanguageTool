const axios = require('axios');
const { getLanguageCode } = require('../utils/languageCodes');
const config = require('../config/config');
const { pool } = require('../config/database');
const { getSchoolFeature } = require('../utils/schoolFeatures');

/**
 * Resolve a target language (name or code) to its translation code.
 * DB-first (the admin-managed source of truth), so any language the super admin
 * adds translates with its stored `code`. Falls back to the hardcoded map only
 * when the DB has nothing.
 */
const resolveTargetCode = async (targetLang) => {
    if (!targetLang) return 'en';
    try {
        const r = await pool.query(
            'SELECT code FROM languages WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1',
            [targetLang]
        );
        if (r.rows[0]?.code) return r.rows[0].code;
    } catch (err) {
        console.warn('resolveTargetCode DB lookup failed, using hardcoded map:', err.message);
    }
    return getLanguageCode(targetLang);
};

// Thrown when a school has used up its translation character allowance.
class QuotaExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = 'QuotaExceededError';
        this.code = 'TRANSLATION_QUOTA_EXCEEDED';
    }
}

/**
 * Core translation logic — Google Cloud Translation ONLY (no free fallback).
 * Meters usage against the school's translation character allowance and hard-blocks
 * when the limit is reached.
 *
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language name or code (e.g. "Spanish")
 * @param {number|null} schoolId - Requester's school (for quota + metering)
 * @returns {Promise<string>} Translated text
 * @throws {QuotaExceededError} when the school's translation allowance is used up
 */
const performTranslation = async (text, targetLang, schoolId = null) => {
    if (!text || !targetLang) return null;

    if (!config.googleApiKey) {
        throw new Error('Translation is not configured (missing GOOGLE_API_KEY)');
    }

    // Quota check (hard block) — mirror of the in-person minutes pattern
    if (schoolId) {
        const q = await pool.query(
            'SELECT translation_chars_used, translation_chars_limit FROM schools WHERE id = $1',
            [schoolId]
        );
        const row = q.rows[0];
        if (row && row.translation_chars_limit > 0 && row.translation_chars_used >= row.translation_chars_limit) {
            throw new QuotaExceededError('Your school has reached its translation character limit.');
        }
    }

    // Resolve language code (DB-first so any added language works)
    const targetCode = await resolveTargetCode(targetLang);

    // Google Cloud Translation (the only path)
    const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${config.googleApiKey}`,
        { q: text, target: targetCode }
    );
    const translatedText = response.data.data.translations[0].translatedText;

    // Meter usage (count source characters sent)
    if (schoolId && text.length > 0) {
        try {
            await pool.query(
                'UPDATE schools SET translation_chars_used = translation_chars_used + $1 WHERE id = $2',
                [text.length, schoolId]
            );
        } catch (meterErr) {
            console.error('Failed to record translation usage:', meterErr.message);
        }
    }

    return translatedText;
};

/**
 * REST Endpoint for translation
 */
const translateText = async (req, res) => {
    try {
        const { text, targetLang } = req.body;

        if (!text || !targetLang) {
            return res.status(400).json({
                success: false,
                message: 'Text and target language are required'
            });
        }

        const entitled = await getSchoolFeature(req.user?.school_id, 'premium_translation');
        if (!entitled) {
            return res.status(403).json({ success: false, message: 'Translation is not enabled for this school' });
        }

        const translatedText = await performTranslation(text, targetLang, req.user?.school_id);
        const targetCode = await resolveTargetCode(targetLang);

        res.json({
            success: true,
            translatedText,
            source: 'google-cloud',
            targetLanguage: targetLang,
            targetCode
        });

    } catch (error) {
        if (error.code === 'TRANSLATION_QUOTA_EXCEEDED') {
            return res.status(403).json({ success: false, code: error.code, message: error.message });
        }
        console.error('Translation error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Translation failed',
            error: error.message
        });
    }
};

module.exports = {
    translateText,
    performTranslation,
    QuotaExceededError
};
