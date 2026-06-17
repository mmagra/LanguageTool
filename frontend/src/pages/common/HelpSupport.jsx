import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Phone, Clock, Check, HelpCircle, Globe, Search, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import LoadingState from '../../components/common/LoadingState';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 25;

const HelpSupport = () => {
    const { t } = useTranslation();

    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Pull the live supported-language list so counts/rows stay accurate automatically.
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await api.getSystemLanguages();
                if (active && res.success) {
                    setLanguages([...res.data].sort((a, b) => a.name.localeCompare(b.name)));
                }
            } catch (_) {
                // leave list empty on failure
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    // Reset to first page whenever the search changes
    useEffect(() => { setPage(1); }, [search]);

    const total = languages.length;
    const voiceCount = languages.filter(l => l.tts_premium).length;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return languages;
        return languages.filter(l =>
            l.name.toLowerCase().includes(q) || (l.code || '').toLowerCase().includes(q)
        );
    }, [languages, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="h-full overflow-y-auto animate-fade-in font-inter p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <div className="inline-flex p-3 bg-primary-50 rounded-full mb-4">
                        <HelpCircle className="text-primary-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900 mb-2">{t('helpSupport:title')}</h1>
                    <p className="text-slate-600 max-w-4xl mx-auto">
                        {t('helpSupport:description')}
                    </p>
                </div>

                {/* Contact Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Mail size={18} className="text-primary-600" />
                            {t('helpSupport:contact.title')}
                        </h2>
                    </div>
                    <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Mail className="text-primary-500" size={18} /> {t('helpSupport:contact.emailTitle')}
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-primary-600 font-medium mb-1">{import.meta.env.VITE_SUPPORT_EMAIL || 'support@spokenedge.com'}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <HelpCircle size={12} />
                                    <span>{t('helpSupport:contact.title')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Phone className="text-emerald-500" size={18} /> {t('helpSupport:contact.phoneTitle')}
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-slate-900 font-bold mb-1">{import.meta.env.VITE_SUPPORT_PHONE || '+1 (800) 000-0000'}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock size={12} />
                                    <span>{t('helpSupport:contact.hours')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 pb-6 text-center">
                        <p className="text-slate-600 text-sm">
                            {t('helpSupport:contact.footer')}
                        </p>
                    </div>
                </div>

                {/* Supported Languages */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Globe size={18} className="text-primary-600" />
                                {t('helpSupport:supportedLanguages.title')}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                                    <Globe size={12} /> {total} languages
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                    <Volume2 size={12} /> {voiceCount} with voice
                                </span>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search languages…"
                                aria-label="Search languages"
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <LoadingState label="Loading languages…" />
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 text-sm">No languages match your search.</div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 w-12">#</th>
                                            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Language</th>
                                            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 text-center">Translation</th>
                                            <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 text-center">Voice</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {paged.map((lang, index) => (
                                            <tr key={lang.id || lang.code} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3 text-slate-400">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                                <td className="px-6 py-3">
                                                    <span className="font-medium text-slate-900">{lang.name}</span>
                                                    {lang.code && <span className="ml-2 text-xs text-slate-400 font-mono uppercase">{lang.code}</span>}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <Check size={18} className="text-emerald-500 mx-auto" />
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {lang.tts_premium ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium">
                                                            <Volume2 size={12} /> Voice
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 text-xs font-medium">
                                                            Text only
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="sm:hidden divide-y divide-slate-100">
                                {paged.map((lang, index) => (
                                    <div key={lang.id || lang.code} className="flex items-center justify-between px-4 py-3">
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                <span className="text-slate-400 mr-1.5">{(page - 1) * PAGE_SIZE + index + 1}.</span>
                                                {lang.name}
                                            </p>
                                            {lang.code && <p className="text-xs text-slate-400 font-mono uppercase mt-0.5">{lang.code}</p>}
                                        </div>
                                        {lang.tts_premium ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium">
                                                <Volume2 size={12} /> Voice
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 text-xs font-medium">
                                                Text
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onChange={setPage}
                                totalItems={filtered.length}
                                pageSize={PAGE_SIZE}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
