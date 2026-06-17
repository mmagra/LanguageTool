const { pool } = require('../config/database');

/**
 * Look up a single boolean feature flag from a school's `features` JSONB column.
 * Returns false for missing school, missing column, or missing key.
 *
 * @param {number|string|null} schoolId
 * @param {string} key - e.g. 'premium_translation', 'premium_tts'
 * @returns {Promise<boolean>}
 */
const getSchoolFeature = async (schoolId, key) => {
    if (!schoolId) return false;
    try {
        const result = await pool.query('SELECT features FROM schools WHERE id = $1', [schoolId]);
        const features = result.rows[0]?.features;
        return features?.[key] === true;
    } catch (err) {
        console.error(`Failed to read school feature "${key}" for school ${schoolId}:`, err.message);
        return false; // Fail safe: treat as not entitled (free path)
    }
};

module.exports = { getSchoolFeature };
