/**
 * Service to handle Speech-to-Text, Translation, and Text-to-Speech
 * Uses Web Speech API (free in Chrome/Edge)
 */

class TranslationService {
    constructor() {
        // Check browser support
        this.recognition = null;
        this.synthesis = window.speechSynthesis;

        if ('webkitSpeechRecognition' in window) {
            this.recognition = new window.webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
        } else {
            console.warn('Web Speech API not supported in this browser.');
        }

        this.isListening = false;
        this.transcriptBuffer = '';
    }

    /**
     * Start listening for speech
     * @param {string} langCode - e.g., 'en-US', 'es-ES'
     * @param {function} onResult - Callback(text, isFinal)
     * @param {function} onError - Callback(error)
     */
    startListening(langCode = 'en-US', onResult, onError) {
        if (!this.recognition) return;

        if (this.isListening) this.stopListening();

        this.recognition.lang = langCode;

        this.recognition.onstart = () => {
            this.isListening = true;
            console.log(`🎤 Listening started in ${langCode}...`);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            // Auto-restart if it stops unexpectedly (unless manually stopped)
            // But for now, we'll let the UI handle restart logic
            console.log('🎤 Listening stopped.');
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (onError) onError(event.error);
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (onResult) {
                onResult({
                    interim: interimTranscript,
                    final: finalTranscript
                });
            }
        };

        this.recognition.start();
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    /**
     * Real Translation Function
     * Calls backend API which uses Google Cloud Translation API (primary)
     * or free Google Translate endpoint (fallback)
     */
    async translateText(text, targetLang) {
        try {
            console.log(`🔤 Translating "${text}" to ${targetLang}`);

            const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    targetLang
                })
            });

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.translatedText) {
                console.log(`✅ Translation successful (${data.source}):`, data.translatedText);
                return data.translatedText;
            } else {
                throw new Error('Invalid response from translation API');
            }
        } catch (error) {
            console.error('Translation error:', error);
            // Return original text as fallback
            return text;
        }
    }

    /**
     * Text-to-Speech
     */
    speakText(text, langCode = 'en-US') {
        if (!this.synthesis) return;

        // Cancel current speech if any
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.0;

        this.synthesis.speak(utterance);
    }
}

export const translationService = new TranslationService();
