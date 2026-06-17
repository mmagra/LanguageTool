/**
 * Speech-to-Text (free browser Web Speech API), Translation + Text-to-Speech (Google Cloud only).
 */

class TranslationService {
    constructor() {
        // Speech-to-Text stays on the free browser engine.
        this.recognition = null;
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new window.webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
        } else {
            console.warn('Web Speech API not supported in this browser.');
        }

        this.isListening = false;
        this.transcriptBuffer = '';
        this.currentAudio = null; // tracks the playing Cloud-TTS <audio> so we can cancel it
    }

    /**
     * Retained for backward compatibility (no-op now that voice is Cloud-only and mode is passed explicitly).
     */
    configure() { /* no-op */ }

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
            // The /translate endpoint requires authentication — attach the JWT.
            const token = localStorage.getItem('token');

            const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    text,
                    targetLang
                })
            });

            if (response.status === 403) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Translation is not enabled for this school');
            }

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
            throw error;
        }
    }

    /**
     * Stop any in-progress Cloud audio playback.
     */
    cancelSpeech() {
        if (this.currentAudio) {
            try { this.currentAudio.pause(); } catch (_) { /* ignore */ }
            this.currentAudio = null;
        }
    }

    /**
     * Text-to-Speech — Google Cloud ONLY (no free browser voice).
     * @param {string} text
     * @param {string} langCode - BCP-47 locale (e.g. es-ES)
     * @param {('premium'|'none')} [mode] - 'premium' → Google Cloud voice; 'none' → silent (text-only language).
     *   On any failure (quota reached, error) there is NO audio — the message text still shows.
     */
    async speakText(text, langCode = 'en-US', mode) {
        this.cancelSpeech();
        if (!text) return;

        const resolved = mode || 'premium';
        if (resolved !== 'premium') return; // 'none' → text-only, stay silent

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/speech/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ text, languageCode: langCode })
            });

            if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
            const data = await response.json();
            if (!data.success || !data.audioContent) throw new Error('No audio returned');

            const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
            this.currentAudio = audio;
            audio.onended = () => { if (this.currentAudio === audio) this.currentAudio = null; };
            await audio.play();
        } catch (error) {
            // Rethrow so callers can decide whether to show a toast.
            // Auto-play callers should .catch(() => {}) to stay silent.
            throw error;
        }
    }
}

export const translationService = new TranslationService();
