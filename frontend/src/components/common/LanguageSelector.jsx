import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../utils/languages';

const LanguageSelector = ({ collapsed }) => {
    const { i18n } = useTranslation();

    const handleChange = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    if (collapsed) return null;

    return (
        <div className="px-4 py-2 border-t border-slate-100 mt-auto">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block pl-1">
                Language
            </label>
            <select
                value={i18n.language}
                onChange={handleChange}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:border-primary-500 bg-white hover:border-slate-300 transition-colors cursor-pointer"
            >
                {Object.entries(LANGUAGES).map(([name, code]) => (
                    <option key={code} value={code}>
                        {name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;
