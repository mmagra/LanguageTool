import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Check, X, Edit, Languages as LangIcon, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Common language ISO codes mapping
const LANGUAGE_CODES = {
    'spanish': { code: 'es', speech: 'es-ES' },
    'french': { code: 'fr', speech: 'fr-FR' },
    'german': { code: 'de', speech: 'de-DE' },
    'italian': { code: 'it', speech: 'it-IT' },
    'portuguese': { code: 'pt', speech: 'pt-PT' },
    'chinese': { code: 'zh', speech: 'zh-CN' },
    'japanese': { code: 'ja', speech: 'ja-JP' },
    'korean': { code: 'ko', speech: 'ko-KR' },
    'russian': { code: 'ru', speech: 'ru-RU' },
    'arabic': { code: 'ar', speech: 'ar-SA' },
    'hindi': { code: 'hi', speech: 'hi-IN' },
    'dutch': { code: 'nl', speech: 'nl-NL' },
    'polish': { code: 'pl', speech: 'pl-PL' },
    'turkish': { code: 'tr', speech: 'tr-TR' },
    'swedish': { code: 'sv', speech: 'sv-SE' },
    'norwegian': { code: 'no', speech: 'no-NO' },
    'danish': { code: 'da', speech: 'da-DK' },
    'finnish': { code: 'fi', speech: 'fi-FI' },
    'greek': { code: 'el', speech: 'el-GR' },
    'hebrew': { code: 'he', speech: 'he-IL' },
    'thai': { code: 'th', speech: 'th-TH' },
    'vietnamese': { code: 'vi', speech: 'vi-VN' },
    'indonesian': { code: 'id', speech: 'id-ID' },
    'malay': { code: 'ms', speech: 'ms-MY' },
    'urdu': { code: 'ur', speech: 'ur-PK' }
};

const Languages = () => {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLang, setEditingLang] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', speech_code: '' });
    const [manuallyEdited, setManuallyEdited] = useState({ code: false, speech_code: false });

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [languageToDelete, setLanguageToDelete] = useState(null);

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            setLoading(true);
            const response = await api.getAllLanguages();
            if (response.success) {
                setLanguages(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch languages:', error);
            toast.error('Failed to load languages');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            const response = await api.toggleLanguage(id);
            if (response.success) {
                setLanguages(prev => prev.map(lang =>
                    lang.id === id ? { ...lang, is_active: response.data.is_active } : lang
                ));
                toast.success(`Language ${response.data.is_active ? 'enabled' : 'disabled'}`);
            }
        } catch (error) {
            toast.error('Failed to toggle status');
        }
    };

    const handleDelete = (lang) => {
        setLanguageToDelete(lang);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!languageToDelete) return;

        try {
            const response = await api.deleteLanguage(languageToDelete.id);
            if (response.success) {
                toast.success('Language deleted successfully');
                fetchLanguages();
                setShowDeleteModal(false);
                setLanguageToDelete(null);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete language');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editingLang) {
                response = await api.updateLanguage(editingLang.id, formData);
            } else {
                response = await api.addLanguage(formData);
            }

            if (response.success) {
                toast.success(editingLang ? 'Language updated' : 'Language added');
                setIsModalOpen(false);
                fetchLanguages(); // Refresh list
                setFormData({ name: '', code: '', speech_code: '' });
                setEditingLang(null);
            }
        } catch (error) {
            toast.error(error.message || 'Operation failed');
        }
    };

    const openEdit = (lang) => {
        setEditingLang(lang);
        setFormData({
            name: lang.name,
            code: lang.code,
            speech_code: lang.speech_code || ''
        });
        setManuallyEdited({ code: true, speech_code: true }); // Existing data is considered manual
        setIsModalOpen(true);
    };

    const handleNameChange = (name) => {
        setFormData(prev => ({ ...prev, name }));

        // Auto-generate codes only if not manually edited
        if (!manuallyEdited.code || !manuallyEdited.speech_code) {
            const lowerName = name.toLowerCase().trim();
            const languageData = LANGUAGE_CODES[lowerName];

            if (languageData) {
                if (!manuallyEdited.code) {
                    setFormData(prev => ({ ...prev, code: languageData.code }));
                }
                if (!manuallyEdited.speech_code) {
                    setFormData(prev => ({ ...prev, speech_code: languageData.speech }));
                }
            } else {
                // Generate basic code from first 2 letters if not in mapping
                if (!manuallyEdited.code && name.length >= 2) {
                    setFormData(prev => ({ ...prev, code: name.substring(0, 2).toLowerCase() }));
                }
            }
        }
    };

    const handleCodeChange = (code) => {
        setFormData(prev => ({ ...prev, code }));
        setManuallyEdited(prev => ({ ...prev, code: true }));
    };

    const handleSpeechCodeChange = (speech_code) => {
        setFormData(prev => ({ ...prev, speech_code }));
        setManuallyEdited(prev => ({ ...prev, speech_code: true }));
    };

    const openAddModal = () => {
        setEditingLang(null);
        setFormData({ name: '', code: '', speech_code: '' });
        setManuallyEdited({ code: false, speech_code: false });
        setIsModalOpen(true);
    };

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 font-inter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Language Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage supported languages and speech codes.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md active:scale-95 text-sm font-medium"
                >
                    <Plus size={18} />
                    Add Language
                </button>
            </div>

            {/* Search Bar & Languages Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-end gap-4 bg-white">
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search languages..."
                            className="pl-10 pr-4 py-2 w-full bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-200 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Speech Code</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredLanguages.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No languages found.</td></tr>
                            ) : (
                                filteredLanguages.map((lang) => (
                                    <tr key={lang.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {lang.code.toUpperCase().slice(0, 2)}
                                            </div>
                                            {lang.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono bg-gray-50/50 rounded px-2 py-1 w-min whitespace-nowrap">{lang.code}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{lang.speech_code || '-'}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggle(lang.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang.is_active
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {lang.is_active ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(lang)}
                                                    className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                                    title="Edit language"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lang)}
                                                    className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                    title="Delete language"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#f0f4fe]">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{editingLang ? 'Edit Language' : 'Add Language'}</h2>
                                <p className="text-xs text-gray-500 mt-1">{editingLang ? 'Update language details' : 'Add a new language to the system'}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <LangIcon size={16} className="text-indigo-600" /> Language Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                        value={formData.name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="e.g. Spanish"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* ISO Code */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">ISO Code</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                            value={formData.code}
                                            onChange={e => handleCodeChange(e.target.value)}
                                            placeholder="e.g. es"
                                        />
                                    </div>

                                    {/* Speech Code */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Speech Code</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                            value={formData.speech_code}
                                            onChange={e => handleSpeechCodeChange(e.target.value)}
                                            placeholder="e.g. es-ES"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={16} />
                                    {editingLang ? 'Update Language' : 'Save Language'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && languageToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Language?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete <strong>{languageToDelete.name}</strong>?
                                This action cannot be undone and may affect students using this language.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setLanguageToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Languages;
