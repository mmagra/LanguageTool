import { useMemo, useState } from 'react';
import { Search, Volume2 } from 'lucide-react';

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'voice', label: 'Voice' },
    { key: 'text', label: 'Text only' },
];

/**
 * Searchable, filterable language picker.
 * Props:
 *   languages — [{ id, code, name, tts_premium }] — full list from API
 *   selected  — Set<string> of selected language codes
 *   onChange  — (newSet: Set<string>) => void
 * English (code='en') is always locked-checked internally.
 */
const LanguageAllocator = ({ languages = [], selected = new Set(), onChange }) => {
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState('all');

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return languages.filter(l => {
            const matchesSearch = !q || l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q);
            const matchesTab = tab === 'all' || (tab === 'voice' ? l.tts_premium : !l.tts_premium);
            return matchesSearch && matchesTab;
        });
    }, [languages, query, tab]);

    const toggle = (code) => {
        if (code === 'en') return;
        const next = new Set(selected);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        onChange(next);
    };

    const selectAllVisible = () => {
        const next = new Set(selected);
        filtered.forEach(l => { if (l.code !== 'en') next.add(l.code); });
        onChange(next);
    };

    const deselectAll = () => {
        onChange(new Set(['en']));
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search languages..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
                    />
                </div>

                {/* Filter tabs */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 shrink-0">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                tab === t.key
                                    ? 'bg-white text-primary-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Count badge */}
                <span className="shrink-0 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl whitespace-nowrap">
                    {selected.size} of {languages.length} selected
                </span>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={selectAllVisible}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline transition"
                >
                    Select all visible ({filtered.filter(l => l.code !== 'en').length})
                </button>
                <button
                    onClick={deselectAll}
                    className="text-xs font-semibold text-slate-500 hover:text-red-600 hover:underline transition"
                >
                    Deselect all
                </button>
            </div>

            {/* Scrollable list */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                    {filtered.length === 0 ? (
                        <div className="py-10 text-center text-sm text-slate-400">
                            No languages match your search.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map(lang => {
                                const isEnglish = lang.code === 'en';
                                const isChecked = isEnglish || selected.has(lang.code);
                                return (
                                    <label
                                        key={lang.code}
                                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                                            isEnglish
                                                ? 'bg-slate-50 opacity-60 pointer-events-none'
                                                : isChecked
                                                    ? 'bg-primary-50/60 hover:bg-primary-50'
                                                    : 'bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggle(lang.code)}
                                            disabled={isEnglish}
                                            className="w-4 h-4 rounded accent-primary-600 shrink-0"
                                        />
                                        <span className={`flex-1 text-sm font-medium ${isChecked && !isEnglish ? 'text-primary-700' : 'text-slate-700'}`}>
                                            {lang.name}
                                            {isEnglish && (
                                                <span className="ml-2 text-xs font-bold uppercase tracking-wide text-slate-400">Default</span>
                                            )}
                                        </span>
                                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                            lang.tts_premium
                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {lang.tts_premium ? (
                                                <>
                                                    <Volume2 size={10} />
                                                    Voice
                                                </>
                                            ) : 'Text only'}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LanguageAllocator;
