import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

/**
 * Hook to fetch and manage valid languages for the current context.
 * In Phase 2: Fetches all active system languages.
 * In Phase 3: Will filter by the logged-in user's school's allowed languages.
 */
const useSchoolLanguages = () => {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                // Check if we have a token (logged in)
                const token = localStorage.getItem('token');
                let response;

                if (token) {
                    // Phase 3: Filter by user's school
                    response = await api.getMySchoolLanguages();
                } else {
                    // Fallback (e.g. Login page): Get all system languages
                    response = await api.getSystemLanguages();
                }

                if (response.success) {
                    setLanguages(response.data);
                } else {
                    // Keep quiet about errors if not logged in or special cases, 
                    // but for school languages we might want to know.
                    console.warn('Failed to load languages (API returned false success)');
                }
            } catch (err) {
                console.error('Error in useSchoolLanguages:', err);
                setError(err.message || 'Failed to load languages');
                // Optional: Don't spam toast on initial load if it's a silent background fetch
                // toast.error('Could not load language settings'); 
            } finally {
                setLoading(false);
            }
        };

        fetchLanguages();
    }, []);

    // Helper to get formatted options for Select components
    const getLanguageOptions = () => {
        return languages.map(lang => ({
            value: lang.code,
            label: lang.name,
            speechCode: lang.speech_code
        }));
    };

    return {
        languages,
        loading,
        error,
        getLanguageOptions
    };
};

export default useSchoolLanguages;
