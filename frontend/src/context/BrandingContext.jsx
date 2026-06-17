import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { translationService } from '../services/translationService';

const BrandingContext = createContext();

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }) => {
    const { user } = useAuth();
    const [schoolName, setSchoolName] = useState('Spoken Edge');
    const [logoUrl, setLogoUrl] = useState(null);
    const [loading, setLoading] = useState(false); // Don't block whole app, just load async
    const [planTier, setPlanTier] = useState('basic');
    const [premiumTTS, setPremiumTTS] = useState(false);

    useEffect(() => {
        if (user) {
            fetchBranding();
        } else {
            // Reset to defaults on logout
            setSchoolName('Spoken Edge');
            setLogoUrl(null);
            setPremiumTTS(false);
            translationService.configure({ premiumTTS: false });
        }
    }, [user]);

    const fetchBranding = async () => {
        try {
            setLoading(true);
            const response = await api.getBranding();
            if (response.success) {
                const { name, logo_url, plan_tier, premium_tts } = response.data;
                setSchoolName(name || 'Spoken Edge');
                setLogoUrl(logo_url);
                setPlanTier(plan_tier || 'basic');

                const ttsEnabled = premium_tts === true;
                setPremiumTTS(ttsEnabled);
                // Tell the speech layer which voice path to use (Cloud vs browser)
                translationService.configure({ premiumTTS: ttsEnabled });

                // Update document title dynamically?
                document.title = `${name || 'Spoken Edge'} - Language Learning`;
            }
        } catch (error) {
            console.error('Failed to fetch branding:', error);
            // Fallback to default
        } finally {
            setLoading(false);
        }
    };

    return (
        <BrandingContext.Provider value={{ schoolName, logoUrl, planTier, premiumTTS, loading, refreshBranding: fetchBranding }}>
            {children}
        </BrandingContext.Provider>
    );
};
