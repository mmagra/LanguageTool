const axios = require('axios');
const config = require('../config/config');
const { getSchoolFeature } = require('../utils/schoolFeatures');
const { pool } = require('../config/database');

// Cache the cheapest (Standard) voice per locale so we don't list voices on every call.
const standardVoiceCache = new Map(); // `${languageCode}|${gender}` -> voiceName | null

/**
 * Find a Google "Standard" voice ($4/M — the cheapest tier) for a locale.
 * Used when no specific voice is chosen, so cost can never silently jump to
 * WaveNet ($16/M) or Studio ($160/M).
 */
const getCheapestVoice = async (languageCode, gender) => {
    const key = `${languageCode}|${gender || ''}`;
    if (standardVoiceCache.has(key)) return standardVoiceCache.get(key);
    try {
        const r = await axios.get(
            `https://texttospeech.googleapis.com/v1/voices?languageCode=${encodeURIComponent(languageCode)}&key=${config.googleApiKey}`,
            { timeout: 8000 }
        );
        const voices = r.data?.voices || [];
        const standard = voices.filter(v => /Standard/i.test(v.name));
        const pick = standard.find(v => !gender || v.ssmlGender === gender) || standard[0] || null;
        const name = pick ? pick.name : null;
        standardVoiceCache.set(key, name);
        return name;
    } catch (_) {
        standardVoiceCache.set(key, null);
        return null;
    }
};

/**
 * Premium Text-to-Speech via Google Cloud Text-to-Speech REST API.
 * Returns base64-encoded MP3 audio. Gated on BOTH the school's `premium_tts`
 * AND the language's `tts_premium`; uses the language's chosen voice_name/voice_gender.
 * Any failure → frontend falls back to the free browser voice.
 *
 * @route POST /api/speech/tts
 * @access Private (school premium_tts + language tts_premium)
 */
const synthesize = async (req, res) => {
    try {
        const { text, languageCode } = req.body;

        if (!text || !languageCode) {
            return res.status(400).json({ success: false, message: 'text and languageCode are required' });
        }

        // School-level entitlement
        const entitled = await getSchoolFeature(req.user?.school_id, 'premium_tts');
        if (!entitled) {
            return res.status(403).json({ success: false, message: 'Voice is not enabled for this school' });
        }

        if (!config.googleApiKey) {
            return res.status(503).json({ success: false, message: 'Text-to-Speech is not configured on the server' });
        }

        // Voice character quota (hard block) — mirror of the in-person minutes pattern
        if (req.user?.school_id) {
            const q = await pool.query(
                'SELECT tts_chars_used, tts_chars_limit FROM schools WHERE id = $1',
                [req.user.school_id]
            );
            const row = q.rows[0];
            if (row && row.tts_chars_limit > 0 && row.tts_chars_used >= row.tts_chars_limit) {
                return res.status(403).json({ success: false, code: 'TTS_QUOTA_EXCEEDED', message: 'Your school has reached its voice character limit.' });
            }
        }

        // Resolve the language row (by speech_code or code) for its premium flag + chosen voice
        const langResult = await pool.query(
            'SELECT tts_premium, voice_name, voice_gender FROM languages WHERE speech_code = $1 OR code = $1 LIMIT 1',
            [languageCode]
        );
        const lang = langResult.rows[0];

        // Language-level entitlement
        if (lang && lang.tts_premium !== true) {
            return res.status(403).json({ success: false, message: 'This language has no premium voice' });
        }

        // Build the voice config.
        // - If the super admin explicitly chose a voice, respect it.
        // - Otherwise force the cheapest Standard voice ($4/M) so cost never
        //   silently jumps to WaveNet/Studio tiers.
        const voice = { languageCode };
        if (lang?.voice_name) {
            voice.name = lang.voice_name;
        } else {
            const cheapest = await getCheapestVoice(languageCode, lang?.voice_gender);
            if (cheapest) voice.name = cheapest;
        }
        voice.ssmlGender = lang?.voice_gender || 'NEUTRAL';

        const response = await axios.post(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.googleApiKey}`,
            {
                input: { text },
                voice,
                audioConfig: { audioEncoding: 'MP3' }
            },
            { timeout: 10000 }
        );

        const audioContent = response.data?.audioContent;
        if (!audioContent) {
            return res.status(502).json({ success: false, message: 'No audio returned from Text-to-Speech' });
        }

        // Meter voice usage (count characters spoken)
        if (req.user?.school_id && text.length > 0) {
            try {
                await pool.query(
                    'UPDATE schools SET tts_chars_used = tts_chars_used + $1 WHERE id = $2',
                    [text.length, req.user.school_id]
                );
            } catch (meterErr) {
                console.error('Failed to record voice usage:', meterErr.message);
            }
        }

        res.json({ success: true, audioContent }); // base64 MP3
    } catch (error) {
        const detail = error.response?.data?.error?.message || error.message;
        console.error('TTS synthesize error:', detail);
        res.status(500).json({ success: false, message: 'Text-to-Speech failed', error: detail });
    }
};

module.exports = { synthesize };
