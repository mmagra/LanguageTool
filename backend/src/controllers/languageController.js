const axios = require('axios');
const { pool } = require('../config/database');
const { logAction } = require('./auditController');
const config = require('../config/config');
const { GOOGLE_LANGUAGES } = require('../utils/googleLanguages');

// ---------------------------------------------------------------------------
// LIVE Google catalog: the authoritative list of Translation languages, each
// auto-annotated with whether a Text-to-Speech voice exists (+ cheapest voice).
// Cached in memory so we don't call Google on every request.
// ---------------------------------------------------------------------------
let _catalogCache = { at: 0, data: null };
const CATALOG_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Translation base code → TTS base code, for the handful Google names differently.
const TTS_ALIAS = { zh: 'cmn', iw: 'he', jw: 'jv', tl: 'fil', no: 'nb', he: 'he' };

// Reduce any code (e.g. "zh-CN") to the TTS base used to key the voice index ("cmn").
const ttsBase = (code) => {
    const base = String(code).toLowerCase().split('-')[0];
    return TTS_ALIAS[base] || base;
};

const getGoogleCatalog = async () => {
    // Serve from cache when fresh
    if (_catalogCache.data && (Date.now() - _catalogCache.at) < CATALOG_TTL_MS) {
        return _catalogCache.data;
    }
    if (!config.googleApiKey) {
        return GOOGLE_LANGUAGES; // offline fallback
    }
    try {
        const [langRes, voiceRes] = await Promise.all([
            axios.get(`https://translation.googleapis.com/language/translate/v2/languages?target=en&key=${config.googleApiKey}`, { timeout: 12000 }),
            axios.get(`https://texttospeech.googleapis.com/v1/voices?key=${config.googleApiKey}`, { timeout: 12000 }),
        ]);

        const languages = langRes.data?.data?.languages || [];
        const voices = voiceRes.data?.voices || [];

        // Index voices by their TTS base code; prefer Standard voices.
        const voicesByBase = new Map(); // base -> [{ languageCode, name, gender, isStandard }]
        for (const v of voices) {
            for (const lc of (v.languageCodes || [])) {
                const base = lc.split('-')[0].toLowerCase();
                if (!voicesByBase.has(base)) voicesByBase.set(base, []);
                voicesByBase.get(base).push({ languageCode: lc, name: v.name, gender: v.ssmlGender, isStandard: /Standard/i.test(v.name) });
            }
        }

        const catalog = languages.map((l) => {
            const base = ttsBase(l.language);
            const candidates = voicesByBase.get(base) || [];
            // COST RULE: only the cheap Standard ($4/M) tier. A language is "voiced"
            // only if a Standard voice exists; otherwise it stays text-only (we never
            // auto-use WaveNet/Neural2/Studio). Prefer a region match (zh-CN → cmn-CN).
            const region = (String(l.language).split('-')[1] || '').toUpperCase();
            const standards = candidates.filter(v => v.isStandard);
            const regional = region ? standards.filter(v => v.languageCode.toUpperCase().endsWith('-' + region)) : [];
            const pick = regional[0] || standards[0] || null;
            return {
                code: l.language,
                name: l.name,
                speech_code: pick ? pick.languageCode : null,
                tts_premium: !!pick,
                tts_free: false,
                voice_name: pick ? pick.name : null,
                voice_gender: pick ? pick.gender : null,
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

        _catalogCache = { at: Date.now(), data: catalog };
        return catalog;
    } catch (err) {
        console.error('Live Google catalog fetch failed, using static fallback:', err.message);
        return GOOGLE_LANGUAGES;
    }
};

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
    const { name, code, speech_code, is_active, tts_free, tts_premium, voice_name, voice_gender } = req.body;

    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO languages (name, code, speech_code, is_active, tts_free, tts_premium, voice_name, voice_gender)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                name, code, speech_code || null,
                is_active !== undefined ? is_active : true,
                tts_free === true,
                tts_premium === true,
                voice_name || null,
                voice_gender || null
            ]
        );

        try {
            logAction(req.user.id, req.user.email, 'CREATE_LANGUAGE', 'language', result.rows[0].id, { name, code }, req);
        } catch (e) { console.error('Audit log error', e); }

        res.status(201).json({
            success: true,
            message: 'Language added successfully',
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
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
    const { name, code, speech_code, tts_free, tts_premium, voice_name, voice_gender } = req.body;

    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Name and Code are required' });
    }

    try {
        const result = await pool.query(
            `UPDATE languages
             SET name = $1, code = $2, speech_code = $3,
                 tts_free = COALESCE($4, tts_free),
                 tts_premium = COALESCE($5, tts_premium),
                 voice_name = $6,
                 voice_gender = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [
                name, code, speech_code || null,
                tts_free === undefined ? null : tts_free === true,
                tts_premium === undefined ? null : tts_premium === true,
                voice_name || null,
                voice_gender || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Language not found' });
        }

        try {
            logAction(req.user.id, req.user.email, 'UPDATE_LANGUAGE', 'language', id, { name, code }, req);
        } catch (e) { console.error('Audit log error', e); }

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

        try {
            logAction(req.user.id, req.user.email, 'TOGGLE_LANGUAGE', 'language', id, {
                is_active: result.rows[0].is_active
            }, req);
        } catch (e) { console.error('Audit log error', e); }

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

        try {
            logAction(req.user.id, req.user.email, 'DELETE_LANGUAGE', 'language', id, {
                name: result.rows[0].name
            }, req);
        } catch (e) { console.error('Audit log error', e); }

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

// @desc    Get the Google language catalog, flagged with which are already added
// @route   GET /api/super-admin/languages/catalog
// @access  Super Admin
exports.getCatalog = async (req, res) => {
    try {
        const catalog = await getGoogleCatalog();
        const existing = await pool.query('SELECT code, name FROM languages');
        // Match the same way import dedupes (code OR name), so variant codes
        // (e.g. zh-CN/zh, he/iw, jv/jw) don't reappear as "not added".
        const haveCodes = new Set(existing.rows.map(r => r.code.toLowerCase()));
        const haveNames = new Set(existing.rows.map(r => r.name.toLowerCase()));
        const data = catalog.map(l => ({
            ...l,
            added: haveCodes.has(l.code.toLowerCase()) || haveNames.has(l.name.toLowerCase()),
        }));
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error fetching language catalog:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Import Google catalog (all, or a subset of codes) — upsert by code
// @route   POST /api/super-admin/languages/import
// @access  Super Admin
exports.importCatalog = async (req, res) => {
    const { codes } = req.body || {};
    const catalog = await getGoogleCatalog();
    const wanted = Array.isArray(codes) && codes.length > 0
        ? catalog.filter(l => codes.includes(l.code))
        : catalog;

    let added = 0;
    let updated = 0;
    let failed = 0;
    try {
        for (const l of wanted) {
            try {
                // Match an existing language by code OR name (handles legacy-code differences like he/iw).
                const existing = await pool.query(
                    'SELECT id FROM languages WHERE code = $1 OR name ILIKE $2 LIMIT 1',
                    [l.code, l.name]
                );

                if (existing.rows.length > 0) {
                    // Update speech config + auto voice — never rewrite existing name/code (protects references).
                    await pool.query(
                        `UPDATE languages
                         SET speech_code = $1,
                             tts_premium = $2,
                             voice_name = $3,
                             voice_gender = $4,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = $5`,
                        [l.speech_code, l.tts_premium, l.voice_name || null, l.voice_gender || null, existing.rows[0].id]
                    );
                    updated++;
                } else {
                    await pool.query(
                        `INSERT INTO languages (name, code, speech_code, tts_premium, voice_name, voice_gender, is_active)
                         VALUES ($1, $2, $3, $4, $5, $6, true)`,
                        [l.name, l.code, l.speech_code, l.tts_premium, l.voice_name || null, l.voice_gender || null]
                    );
                    added++;
                }
            } catch (rowErr) {
                failed++;
                console.warn(`Import skipped "${l.name}" (${l.code}):`, rowErr.message);
            }
        }

        try {
            logAction(req.user.id, req.user.email, 'IMPORT_LANGUAGES', 'language', null, { added, updated, failed, total: wanted.length }, req);
        } catch (e) { console.error('Audit log error', e); }

        res.json({ success: true, message: `Imported: ${added} added, ${updated} updated${failed ? `, ${failed} skipped` : ''}`, data: { added, updated, failed } });
    } catch (err) {
        console.error('Error importing languages:', err);
        res.status(500).json({ success: false, message: 'Server error during import' });
    }
};

// @desc    Remove ALL languages (full wipe for rebuilding from Google)
// @route   DELETE /api/super-admin/languages
// @access  Super Admin
exports.clearAllLanguages = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Detach students' saved language (FK has no cascade), then delete all.
        await client.query('UPDATE student_profiles SET preferred_language_id = NULL WHERE preferred_language_id IS NOT NULL');
        const del = await client.query('DELETE FROM languages RETURNING id'); // school_languages cascades
        await client.query('COMMIT');

        try {
            logAction(req.user.id, req.user.email, 'CLEAR_LANGUAGES', 'language', null, { removed: del.rowCount }, req);
        } catch (e) { console.error('Audit log error', e); }

        res.json({ success: true, message: `Removed all languages (${del.rowCount})`, data: { removed: del.rowCount } });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error clearing languages:', err);
        res.status(500).json({ success: false, message: 'Server error while clearing languages' });
    } finally {
        client.release();
    }
};

// @desc    List available Google Cloud TTS voices for a locale (live from Google)
// @route   GET /api/super-admin/languages/voices?languageCode=es-ES
// @access  Super Admin
exports.getVoices = async (req, res) => {
    const { languageCode } = req.query;
    if (!languageCode) {
        return res.status(400).json({ success: false, message: 'languageCode is required' });
    }
    if (!config.googleApiKey) {
        // No key configured — UI falls back to manual voice entry
        return res.json({ success: true, data: [] });
    }
    try {
        const response = await axios.get(
            `https://texttospeech.googleapis.com/v1/voices?languageCode=${encodeURIComponent(languageCode)}&key=${config.googleApiKey}`,
            { timeout: 10000 }
        );
        const voices = (response.data?.voices || []).map(v => ({
            name: v.name,
            gender: v.ssmlGender,
            languageCodes: v.languageCodes
        }));
        res.json({ success: true, data: voices });
    } catch (err) {
        const detail = err.response?.data?.error?.message || err.message;
        console.error('Error fetching voices:', detail);
        res.json({ success: true, data: [], warning: detail }); // soft-fail → manual entry
    }
};

// @desc    Synthesize a short sample so the super admin can preview a voice (no school gate)
// @route   POST /api/super-admin/languages/preview-voice
// @access  Super Admin
exports.previewVoice = async (req, res) => {
    const { languageCode, voice_name, voice_gender, text } = req.body || {};
    if (!languageCode) {
        return res.status(400).json({ success: false, message: 'languageCode is required' });
    }
    if (!config.googleApiKey) {
        return res.status(503).json({ success: false, message: 'Add GOOGLE_API_KEY to the backend to preview voices' });
    }
    try {
        const voice = { languageCode };
        if (voice_name) voice.name = voice_name;
        voice.ssmlGender = voice_gender || 'NEUTRAL';

        const response = await axios.post(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.googleApiKey}`,
            {
                input: { text: text || 'Hello, this is a voice preview.' },
                voice,
                audioConfig: { audioEncoding: 'MP3' }
            },
            { timeout: 10000 }
        );
        const audioContent = response.data?.audioContent;
        if (!audioContent) {
            return res.status(502).json({ success: false, message: 'No audio returned' });
        }
        res.json({ success: true, audioContent });
    } catch (err) {
        const detail = err.response?.data?.error?.message || err.message;
        console.error('Voice preview error:', detail);
        res.status(500).json({ success: false, message: 'Voice preview failed', error: detail });
    }
};
