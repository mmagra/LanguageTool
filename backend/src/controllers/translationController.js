const axios = require('axios');
const { getLanguageCode } = require('../utils/languageCodes');

/**
 * Translate text using Google Cloud Translation API (primary) 
 * or free Google Translate endpoint (fallback)
 */
/**
 * Core translation logic (Reusable)
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language name (e.g., "Spanish")
 * @returns {Promise<string>} Translated text
 */
const performTranslation = async (text, targetLang) => {
    if (!text || !targetLang) return null;

    // Get language code
    const targetCode = getLanguageCode(targetLang);
    console.log(`🔤 Translating to ${targetLang} (${targetCode})`);

    let translatedText = '';

    // Try Primary: Google Cloud Translation API
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
        try {
            console.log('🔑 Using Google Cloud Translation API');
            const response = await axios.post(
                `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
                {
                    q: text,
                    target: targetCode,
                    source: 'en'
                }
            );
            translatedText = response.data.data.translations[0].translatedText;
            console.log('✅ Translation successful (Google API)');
        } catch (apiError) {
            console.warn('⚠️ Google API failed, falling back to free endpoint:', apiError.message);
        }
    }

    // Fallback: Free Google Translate endpoint
    if (!translatedText) {
        try {
            console.log('🌐 Using free Google Translate endpoint');
            const url = `https://translate.google.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            // Parse response: [[["translated", "original", ...]]]
            if (response.data && Array.isArray(response.data) && response.data[0]) {
                const translations = response.data[0];
                if (Array.isArray(translations) && translations.length > 0) {
                    translatedText = translations
                        .filter(item => Array.isArray(item) && item[0])
                        .map(item => item[0])
                        .join('');
                    console.log('✅ Translation successful (Free endpoint)');
                } else {
                    throw new Error('No translations found in response');
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (freeError) {
            console.error('❌ Free endpoint failed:', freeError.message);
            throw new Error(`Translation failed: ${freeError.message}`);
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

        const translatedText = await performTranslation(text, targetLang);
        const targetCode = getLanguageCode(targetLang);

        res.json({
            success: true,
            translatedText,
            source: process.env.GOOGLE_TRANSLATE_API_KEY ? 'google-api' : 'google-free', // simplified source check
            targetLanguage: targetLang,
            targetCode
        });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            success: false,
            message: 'Translation failed',
            error: error.message
        });
    }
};

module.exports = {
    translateText,
    performTranslation
};
