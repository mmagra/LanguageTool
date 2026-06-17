import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, X, Trash2, Volume2, AlertTriangle, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

const Languages = () => {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState('all'); // all | voice | text

    // Picker (live Google catalog)
    const [showPicker, setShowPicker] = useState(false);
    const [catalog, setCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerSelected, setPickerSelected] = useState(new Set());

    // Remove-all confirm
    const [showClear, setShowClear] = useState(false);
    const [clearing, setClearing] = useState(false);

    // Single-delete confirm
    const [deletingLang, setDeletingLang] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => { fetchLanguages(); }, []);

    const fetchLanguages = async () => {
        try {
            setLoading(true);
            const res = await api.getAllLanguages();
            if (res.success) setLanguages(res.data);
        } catch (_) {
            toast.error('Failed to load languages');
        } finally {
            setLoading(false);
        }
    };

    const openPicker = async () => {
        setShowPicker(true);
        setPickerSelected(new Set());
        setPickerSearch('');
        setCatalogLoading(true);
        try {
            const res = await api.getLanguageCatalog();
            if (res.success) setCatalog(res.data);
        } catch (_) {
            toast.error('Could not load the Google language list');
        } finally {
            setCatalogLoading(false);
        }
    };

    const togglePick = (code) => {
        setPickerSelected(prev => {
            const next = new Set(prev);
            next.has(code) ? next.delete(code) : next.add(code);
            return next;
        });
    };

    const notAdded = catalog.filter(c =>
        !c.added && (c.name.toLowerCase().includes(pickerSearch.toLowerCase()) || c.code.toLowerCase().includes(pickerSearch.toLowerCase()))
    );

    const allVisibleSelected = notAdded.length > 0 && notAdded.every(c => pickerSelected.has(c.code));
    const toggleSelectAll = () => {
        setPickerSelected(prev => {
            if (allVisibleSelected) return new Set();
            return new Set(notAdded.map(c => c.code));
        });
    };

    const handleAddSelected = async () => {
        const codes = [...pickerSelected];
        if (codes.length === 0) return;
        try {
            setImporting(true);
            const res = await api.importLanguages(codes);
            if (res.success) {
                toast.success(res.message);
                setShowPicker(false);
                await fetchLanguages();
            }
        } catch (e) {
            toast.error(e.message || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const handleClearAll = async () => {
        try {
            setClearing(true);
            const res = await api.clearAllLanguages();
            if (res.success) {
                toast.success(res.message);
                setShowClear(false);
                await fetchLanguages();
            }
        } catch (e) {
            toast.error(e.message || 'Failed to remove languages');
        } finally {
            setClearing(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await api.toggleLanguage(id);
            if (res.success) {
                setLanguages(prev => prev.map(l => l.id === id ? { ...l, is_active: res.data.is_active } : l));
            }
        } catch (_) {
            toast.error('Failed to toggle status');
        }
    };

    const handleDelete = async () => {
        if (!deletingLang) return;
        try {
            setDeleteLoading(true);
            const res = await api.deleteLanguage(deletingLang.id);
            if (res.success) { toast.success('Language deleted'); setDeletingLang(null); fetchLanguages(); }
        } catch (e) {
            toast.error(e.message || 'Failed to delete (may be in use)');
        } finally {
            setDeleteLoading(false);
        }
    };

    const matchesTier = (l) => tierFilter === 'voice' ? l.tts_premium : tierFilter === 'text' ? !l.tts_premium : true;
    const filtered = languages.filter(l =>
        matchesTier(l) && (l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const counts = {
        all: languages.length,
        voice: languages.filter(l => l.tts_premium).length,
        text: languages.filter(l => !l.tts_premium).length,
    };

    return (
        <div className="space-y-6 font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900">Language Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Add languages from Google — voice support is detected automatically. <span className="font-semibold text-slate-700">{counts.all} total · {counts.voice} with voice</span></p>
                </div>
                <div className="flex items-center gap-2">
                    {languages.length > 0 && (
                        <button onClick={() => setShowClear(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium">
                            <Trash2 size={18} /> Remove all
                        </button>
                    )}
                    <button onClick={openPicker} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium">
                        <Plus size={18} /> Add Languages
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'voice', label: 'Voice (Google)' },
                            { key: 'text', label: 'Text only' },
                        ].map(t => (
                            <button key={t.key} onClick={() => setTierFilter(t.key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${tierFilter === t.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                {t.label} <span className="opacity-70">({counts[t.key]})</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                        <input type="text" placeholder="Search languages..." aria-label="Search languages"
                            className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Voice</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5"><LoadingState /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5">
                                    <EmptyState
                                        icon={Globe}
                                        title={languages.length === 0 ? 'No languages yet' : 'No languages match'}
                                        description={languages.length === 0 ? 'Click "Add Languages" to import languages from Google.' : 'Try adjusting your search or filter.'}
                                    />
                                </td></tr>
                            ) : filtered.map(lang => (
                                <tr key={lang.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs">{lang.code.toUpperCase().slice(0, 2)}</div>
                                            {lang.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono whitespace-nowrap">{lang.code}</td>
                                    <td className="px-6 py-4">
                                        {lang.tts_premium ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                <Volume2 size={12} /> Voice
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">Text only</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleToggle(lang.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                            {lang.is_active ? 'Active' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setDeletingLang(lang)} aria-label={`Delete ${lang.name}`} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add-from-Google picker */}
            {showPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-lg animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Add Languages from Google</h2>
                                <p className="text-xs text-slate-500 mt-1">Voice support is detected automatically. Codes are filled in for you.</p>
                            </div>
                            <button onClick={() => setShowPicker(false)} className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-500 shadow-sm"><X size={20} /></button>
                        </div>

                        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" autoFocus placeholder="Search the Google language list…" value={pickerSearch}
                                    onChange={e => setPickerSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" />
                            </div>
                            <button onClick={toggleSelectAll} disabled={notAdded.length === 0}
                                className="px-3 py-2 text-sm font-semibold text-primary-700 bg-primary-50 border border-primary-100 rounded-xl hover:bg-primary-100 disabled:opacity-50 whitespace-nowrap">
                                {allVisibleSelected ? 'Clear' : 'Select all'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {catalogLoading ? (
                                <p className="text-center text-slate-500 text-sm py-10">Loading Google language list…</p>
                            ) : notAdded.length === 0 ? (
                                <p className="text-center text-slate-500 text-sm py-10">{catalog.length === 0 ? 'Could not load the list.' : 'All available languages are already added.'}</p>
                            ) : notAdded.map(c => (
                                <label key={c.code} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="w-4 h-4 rounded accent-primary-600" checked={pickerSelected.has(c.code)} onChange={() => togglePick(c.code)} />
                                        <span className="text-sm font-medium text-slate-800">{c.name}</span>
                                        <span className="text-xs text-slate-400 font-mono">{c.code}</span>
                                    </div>
                                    {c.tts_premium
                                        ? <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full"><Volume2 size={11} /> Voice</span>
                                        : <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Text only</span>}
                                </label>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-sm text-slate-500">{pickerSelected.size} selected</span>
                            <button onClick={handleAddSelected} disabled={pickerSelected.size === 0 || importing}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50">
                                {importing ? 'Adding…' : `Add ${pickerSelected.size || ''} language${pickerSelected.size === 1 ? '' : 's'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single-delete confirm */}
            {deletingLang && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={26} className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete "{deletingLang.name}"?</h3>
                        <p className="text-slate-500 text-sm mb-6">This will remove the language from the system. Schools using it may be affected.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletingLang(null)} disabled={deleteLoading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl disabled:opacity-50">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50">
                                {deleteLoading ? 'Deleting…' : 'Yes, delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove-all confirm */}
            {showClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Remove all languages?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            This deletes <strong>all {counts.all} languages</strong> and clears any student's saved language. Schools will need languages re-assigned. You can rebuild instantly with “Add Languages”.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowClear(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl">Cancel</button>
                            <button onClick={handleClearAll} disabled={clearing} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50">
                                {clearing ? 'Removing…' : 'Yes, remove all'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Languages;
