import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import useSchoolLanguages from '../hooks/useSchoolLanguages';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

// --- LEGACY STATIC MAPS (Deprecated - use context helpers instead) ---
// --- DEPRECATED STATIC MAPS ---
// Kept temporarily for backward compatibility during migration
export const LANGUAGE_MAP = {};
export const SPEECH_LOCALE_MAP = {};

// Static fallback helpers (Deprecated)
// We keep these exports so we don't break files that import them directly immediately,
// but they will just use the static maps.
export const getSpeechLocale = (langCode) => SPEECH_LOCALE_MAP[langCode] || langCode;

export const LanguageProvider = ({ children }) => {
    const { user, loading } = useAuth();
    const { i18n } = useTranslation();

    // Fetch dynamic languages
    const { languages: dynamicLanguages, loading: languagesLoading } = useSchoolLanguages();

    // Track current language from i18n
    const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
    const hasInitialized = useRef(false);

    // Helpers utilizing dynamic data
    const getLanguageCodeDynamic = (languageName) => {
        // Try dynamic first
        const found = dynamicLanguages.find(l => l.name === languageName);
        if (found) return found.code;
        // Fallback to English if not found
        return 'en';
    };

    const getSpeechLocaleDynamic = (langCode) => {
        const found = dynamicLanguages.find(l => l.code === langCode);
        if (found && found.speech_code) return found.speech_code;
        // Helper: if no speech code, maybe it's the code itself?
        return langCode;
    };

    /**
     * Decide whether a language can speak (Google Cloud only — no free browser voice):
     *   'premium' → school has voice enabled AND the language has a Google voice
     *   'none'    → text only (no audio)
     */
    const getVoiceMode = (langCode, voiceEnabled) => {
        if (!voiceEnabled) return 'none';
        const found = dynamicLanguages.find(l => l.code === langCode);
        return found?.tts_premium ? 'premium' : 'none';
    };

    const preferredLanguage = user?.preferred_language || 'English';
    const preferredLangCode = getLanguageCodeDynamic(preferredLanguage);
    const isEnglish = currentLang === 'en';

    useEffect(() => {
        const handleLanguageChange = (lng) => {
            setCurrentLang(lng);
        };
        i18n.on('languageChanged', handleLanguageChange);
        return () => i18n.off('languageChanged', handleLanguageChange);
    }, [i18n]);

    // Reset initialization when user logs out
    useEffect(() => {
        // Only trigger logout cleanup if auth has finished loading and there is no user
        if (!loading && !user) {
            hasInitialized.current = false;
            // Force reset to English immediately on logout to prevent next user seeing previous language
            if (i18n.language !== 'en') {
                i18n.changeLanguage('en');
            }
            // Clear session preference
            localStorage.removeItem('session_current_lang');
        }
    }, [user, loading, i18n]);

    useEffect(() => {
        // Wait for dynamic languages to be loaded if possible
        if (languagesLoading) return;

        // If we have user and haven't initialized language for this session yet
        if (user && !hasInitialized.current) {
            const savedSessionLang = localStorage.getItem('session_current_lang');
            let targetLang = 'en';

            if (savedSessionLang) {
                // If user manually switched language this session (or reload), respect it
                targetLang = savedSessionLang;
            } else if (user.role === 'student') {
                // Default: For students, use their preferred/primary language
                if (preferredLangCode) {
                    targetLang = preferredLangCode;
                }
            } else {
                // Default: For others (Teachers/Admins), English
                targetLang = 'en';
            }

            // Apply the language change if needed
            if (i18n.language !== targetLang) {
                i18n.changeLanguage(targetLang);
            }

            // Set session preference so it sticks on reload
            localStorage.setItem('session_current_lang', targetLang);

            hasInitialized.current = true;
        }
    }, [user, preferredLangCode, dynamicLanguages, languagesLoading, i18n]);

    const toggleLanguage = () => {
        const newLang = isEnglish ? preferredLangCode : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('session_current_lang', newLang);
    };

    const value = {
        isEnglish,
        toggleLanguage,
        preferredLanguage,
        preferredLangCode,

        // Expose dynamic data and helpers
        availableLanguages: dynamicLanguages,
        getLanguageCode: getLanguageCodeDynamic,
        getSpeechLocale: getSpeechLocaleDynamic,
        getVoiceMode,

        // Fallback maps (can be used for dropdowns if needed)
        staticLanguageMap: LANGUAGE_MAP
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
