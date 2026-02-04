import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const BrandingContext = createContext();

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }) => {
    const { user } = useAuth();
    const [schoolName, setSchoolName] = useState('Spokene');
    const [logoUrl, setLogoUrl] = useState(null);
    const [loading, setLoading] = useState(false); // Don't block whole app, just load async
    const [planTier, setPlanTier] = useState('basic');

    useEffect(() => {
        if (user) {
            fetchBranding();
        } else {
            // Reset to defaults on logout
            setSchoolName('Spokene');
            setLogoUrl(null);
        }
    }, [user]);

    const fetchBranding = async () => {
        try {
            setLoading(true);
            const response = await api.getBranding();
            if (response.success) {
                const { name, logo_url, plan_tier } = response.data;
                setSchoolName(name || 'Spokene');
                setLogoUrl(logo_url);
                setPlanTier(plan_tier || 'basic');

                // Update document title dynamically?
                document.title = `${name || 'Spokene'} - Language Learning`;
            }
        } catch (error) {
            console.error('Failed to fetch branding:', error);
            // Fallback to default
        } finally {
            setLoading(false);
        }
    };

    return (
        <BrandingContext.Provider value={{ schoolName, logoUrl, planTier, loading }}>
            {children}
        </BrandingContext.Provider>
    );
};
