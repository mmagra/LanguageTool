import React from 'react';
import { Mail, Phone, Clock, Check, X, HelpCircle, Globe, Smartphone, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HelpSupport = () => {
    const { t } = useTranslation();

    // Data from help.php - Table 1 (General Support)
    const inPersonLanguages = [
        { name: "Afrikaans", translate: true, desktop: false, mobile: false },
        { name: "Albanian", translate: true, desktop: false, mobile: false },
        { name: "Amharic", translate: true, desktop: false, mobile: false },
        { name: "Arabic", translate: true, desktop: true, mobile: true },
        { name: "Armenian", translate: true, desktop: false, mobile: false },
        { name: "Azerbaijani", translate: true, desktop: true, mobile: false },
        { name: "Basque", translate: true, desktop: true, mobile: false },
        { name: "Belarusian", translate: true, desktop: false, mobile: false },
        { name: "Bengali", translate: true, desktop: false, mobile: false },
        { name: "Bosnian", translate: true, desktop: false, mobile: false },
        { name: "Bulgarian", translate: true, desktop: false, mobile: false },
        { name: "Catalan", translate: true, desktop: false, mobile: true },
        { name: "Cebuano", translate: true, desktop: false, mobile: false },
        { name: "Chichewa", translate: true, desktop: false, mobile: false },
        { name: "Chinese (Simplified)", translate: true, desktop: true, mobile: true },
        { name: "Chinese (Traditional)", translate: true, desktop: true, mobile: true },
        { name: "Corsican", translate: true, desktop: true, mobile: true },
        { name: "Croatian", translate: true, desktop: true, mobile: true },
        { name: "Czech", translate: true, desktop: false, mobile: true },
        { name: "Danish", translate: true, desktop: true, mobile: true },
        { name: "Dutch", translate: true, desktop: true, mobile: true },
        { name: "English", translate: true, desktop: true, mobile: true },
        { name: "Esperanto", translate: true, desktop: false, mobile: false },
        { name: "Estonian", translate: true, desktop: false, mobile: false },
        { name: "Filipino", translate: true, desktop: false, mobile: false },
        { name: "Finnish", translate: true, desktop: true, mobile: false },
        { name: "French", translate: true, desktop: true, mobile: true },
        { name: "Frisian", translate: true, desktop: false, mobile: false },
        { name: "Galician", translate: true, desktop: false, mobile: false },
        { name: "Georgian", translate: true, desktop: false, mobile: false },
        { name: "German", translate: true, desktop: true, mobile: true },
        { name: "Greek", translate: true, desktop: false, mobile: true },
        { name: "Gujarati", translate: true, desktop: false, mobile: false },
        { name: "Haitian Creole", translate: true, desktop: false, mobile: false },
        { name: "Hausa", translate: true, desktop: true, mobile: false },
        { name: "Hawaiian", translate: true, desktop: false, mobile: false },
        { name: "Hebrew", translate: true, desktop: false, mobile: true },
        { name: "Hindi", translate: true, desktop: true, mobile: true },
        { name: "Hmong", translate: true, desktop: false, mobile: false },
        { name: "Hungarian", translate: true, desktop: false, mobile: true },
        { name: "Icelandic", translate: true, desktop: true, mobile: false },
        { name: "Igbo", translate: true, desktop: false, mobile: false },
        { name: "Indonesian", translate: true, desktop: true, mobile: true },
        { name: "Irish", translate: true, desktop: true, mobile: false },
        { name: "Italian", translate: true, desktop: true, mobile: true },
        { name: "Japanese", translate: true, desktop: true, mobile: true },
        { name: "Javanese", translate: true, desktop: true, mobile: true },
        { name: "Kannada", translate: true, desktop: false, mobile: false },
        { name: "Kazakh", translate: true, desktop: false, mobile: false },
        { name: "Khmer", translate: true, desktop: false, mobile: false },
        { name: "Kinyarwanda", translate: true, desktop: false, mobile: false },
        { name: "Korean", translate: true, desktop: true, mobile: true },
        { name: "Kurdish (Kurmanji)", translate: true, desktop: false, mobile: false },
        { name: "Kyrgyz", translate: true, desktop: false, mobile: false },
        { name: "Lao", translate: true, desktop: false, mobile: false },
        { name: "Latin", translate: true, desktop: false, mobile: true },
        { name: "Latvian", translate: true, desktop: false, mobile: false },
        { name: "Lithuanian", translate: true, desktop: true, mobile: false },
        { name: "Luxembourgish", translate: true, desktop: true, mobile: true },
        { name: "Macedonian", translate: true, desktop: false, mobile: false },
        { name: "Malagasy", translate: true, desktop: false, mobile: false },
        { name: "Malay", translate: true, desktop: false, mobile: true },
        { name: "Malayalam", translate: true, desktop: false, mobile: false },
        { name: "Maltese", translate: true, desktop: false, mobile: false },
        { name: "Maori", translate: true, desktop: false, mobile: false },
        { name: "Marathi", translate: true, desktop: false, mobile: false },
        { name: "Mongolian", translate: true, desktop: false, mobile: false },
        { name: "Myanmar (Burmese)", translate: true, desktop: false, mobile: false },
        { name: "Nepali", translate: true, desktop: false, mobile: false },
        { name: "Norwegian", translate: true, desktop: false, mobile: true },
        { name: "Pashto", translate: true, desktop: false, mobile: false },
        { name: "Persian", translate: true, desktop: false, mobile: false },
        { name: "Polish", translate: true, desktop: true, mobile: true },
        { name: "Portuguese", translate: true, desktop: true, mobile: true },
        { name: "Punjabi", translate: true, desktop: false, mobile: false },
        { name: "Romanian", translate: true, desktop: false, mobile: true },
        { name: "Russian", translate: true, desktop: true, mobile: true },
        { name: "Samoan", translate: true, desktop: false, mobile: false },
        { name: "Scots Gaelic", translate: true, desktop: false, mobile: false },
        { name: "Serbian", translate: true, desktop: false, mobile: false },
        { name: "Sesotho", translate: true, desktop: true, mobile: false },
        { name: "Shona", translate: true, desktop: true, mobile: false },
        { name: "Sindhi", translate: true, desktop: false, mobile: false },
        { name: "Sinhala", translate: true, desktop: false, mobile: false },
        { name: "Slovak", translate: true, desktop: false, mobile: true },
        { name: "Slovenian", translate: true, desktop: false, mobile: false },
        { name: "Somali", translate: true, desktop: false, mobile: false },
        { name: "Spanish", translate: true, desktop: true, mobile: true },
        { name: "Sundanese", translate: true, desktop: true, mobile: false },
        { name: "Swahili", translate: true, desktop: false, mobile: false },
        { name: "Swedish", translate: true, desktop: true, mobile: true },
        { name: "Tajik", translate: true, desktop: false, mobile: false },
        { name: "Tamil", translate: true, desktop: false, mobile: false },
        { name: "Tatar", translate: true, desktop: false, mobile: false },
        { name: "Telugu", translate: true, desktop: false, mobile: false },
        { name: "Thai", translate: true, desktop: false, mobile: true },
        { name: "Turkish", translate: true, desktop: true, mobile: true },
        { name: "Turkmen", translate: true, desktop: false, mobile: false },
        { name: "Ukrainian", translate: true, desktop: false, mobile: true },
        { name: "Urdu", translate: true, desktop: false, mobile: false },
        { name: "Uyghur", translate: true, desktop: false, mobile: false },
        { name: "Uzbek", translate: true, desktop: true, mobile: false },
        { name: "Vietnamese", translate: true, desktop: true, mobile: true },
        { name: "Welsh", translate: true, desktop: false, mobile: false },
        { name: "Xhosa", translate: true, desktop: true, mobile: false },
        { name: "Yiddish", translate: true, desktop: false, mobile: false },
        { name: "Yoruba", translate: true, desktop: true, mobile: false },
        { name: "Zulu", translate: true, desktop: true, mobile: false }
    ];

    // Data from help.php - Table 2 (Detailed Features)
    const detailedLanguages = [
        { name: "Afrikaans", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Albanian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Amharic", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Arabic", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Armenian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Azerbaijani", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: false },
        { name: "Basque", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: false },
        { name: "Belarusian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Bengali", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Bosnian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Bulgarian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Catalan", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Cebuano", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Chichewa", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: false },
        { name: "Chinese (Simplified)", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Chinese (Traditional)", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Corsican", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Croatian", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Czech", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Danish", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Dutch", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "English", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Esperanto", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: false },
        { name: "Estonian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Filipino", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Finnish", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: true },
        { name: "French", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Frisian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: false },
        { name: "Galician", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Georgian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "German", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Greek", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Gujarati", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Haitian Creole", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Hausa", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: false },
        { name: "Hawaiian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Hebrew", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Hindi", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Hmong", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Hungarian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Icelandic", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: true },
        { name: "Igbo", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Indonesian", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Irish", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: false },
        { name: "Italian", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Japanese", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Javanese", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Kannada", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Kazakh", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Khmer", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Kinyarwanda", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Korean", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Kurdish (Kurmanji)", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Kyrgyz", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Lao", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Latin", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Latvian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Lithuanian", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: true },
        { name: "Luxembourgish", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: false },
        { name: "Macedonian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Malagasy", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: false },
        { name: "Malay", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Malayalam", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Maltese", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Maori", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: false },
        { name: "Marathi", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Mongolian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Myanmar (Burmese)", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Nepali", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Norwegian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Pashto", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Persian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Polish", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Portuguese", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Punjabi", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Romanian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Russian", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Samoan", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: false },
        { name: "Scots Gaelic", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Serbian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Sesotho", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: false },
        { name: "Shona", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: false },
        { name: "Sindhi", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Sinhala", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Slovak", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Slovenian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Somali", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Spanish", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Sundanese", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: false },
        { name: "Swahili", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Swedish", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Tajik", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Tamil", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Tatar", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Telugu", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Thai", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Turkish", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Turkmen", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: false },
        { name: "Ukrainian", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: true },
        { name: "Urdu", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Uyghur", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: false },
        { name: "Uzbek", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: false },
        { name: "Vietnamese", translate: true, desktop: true, mobile: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: true, ttsMobile: true },
        { name: "Welsh", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: false, ttsMobile: true },
        { name: "Xhosa", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: false },
        { name: "Yiddish", translate: true, voiceDesktop: true, ttsDesktop: false, voiceMobile: true, ttsMobile: false },
        { name: "Yoruba", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: false },
        { name: "Zulu", translate: true, voiceDesktop: true, ttsDesktop: true, voiceMobile: false, ttsMobile: false }
    ];

    const BooleanIcon = ({ value }) => (
        value ? <Check className="text-green-500 mx-auto" size={20} /> : <X className="text-red-500 mx-auto" size={20} />
    );

    const SupportLabel = ({ supported }) => (
        <span className={`text-sm font-semibold flex items-center gap-1 ${supported ? 'text-green-600' : 'text-red-500'}`}>
            {supported ? <><Check size={14} /> {t('helpSupport:supportedLanguages.supported')}</> : <><X size={14} /> {t('helpSupport:supportedLanguages.notSupported')}</>}
        </span>
    );

    return (
        <div className="h-full overflow-y-auto animate-fade-in font-inter p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <div className="inline-flex p-3 bg-blue-50 rounded-full mb-4">
                        <HelpCircle className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('helpSupport:title')}</h1>
                    <p className="text-gray-600 max-w-4xl mx-auto">
                        {t('helpSupport:description')}
                    </p>
                </div>

                {/* Contact Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-[#f0f4fe]">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Mail size={20} className="text-indigo-600" />
                            {t('helpSupport:contact.title')}
                        </h2>
                    </div>
                    <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Mail className="text-blue-500" size={18} /> {t('helpSupport:contact.emailTitle')}
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <p className="text-indigo-600 font-medium mb-1">khawarshakeel@gmail.com</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <HelpCircle size={12} />
                                    <span>{t('helpSupport:contact.title')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Phone className="text-green-500" size={18} /> {t('helpSupport:contact.phoneTitle')}
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <p className="text-gray-900 font-bold mb-1">(603) 404-1885</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock size={12} />
                                    <span>{t('helpSupport:contact.hours')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 pb-6 text-center">
                        <p className="text-gray-600 text-sm">
                            {t('helpSupport:contact.footer')}
                        </p>
                    </div>
                </div>

                {/* Table 1: Supported Languages */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-[#f0f4fe]">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Globe size={20} className="text-indigo-600" />
                            {t('helpSupport:supportedLanguages.title')}
                        </h2>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm uppercase tracking-wider text-gray-600">
                                    <th className="p-4 font-bold text-center w-16">{t('helpSupport:supportedLanguages.headers.rank')}</th>
                                    <th className="p-4 font-bold">{t('helpSupport:supportedLanguages.headers.language')}</th>
                                    <th className="p-4 font-bold text-center text-xs bg-green-50" dangerouslySetInnerHTML={{ __html: t('helpSupport:supportedLanguages.headers.translation').replace(/\n/g, '<br/>') }} />
                                    <th className="p-4 font-bold text-center text-xs bg-blue-50" dangerouslySetInnerHTML={{ __html: t('helpSupport:supportedLanguages.headers.desktop').replace(/\n/g, '<br/>') }} />
                                    <th className="p-4 font-bold text-center text-xs bg-yellow-50" dangerouslySetInnerHTML={{ __html: t('helpSupport:supportedLanguages.headers.mobile').replace(/\n/g, '<br/>') }} />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {inPersonLanguages.map((lang, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-center text-gray-500">{index + 1}</td>
                                        <td className="p-4 font-medium">{lang.name}</td>
                                        <td className="p-4 bg-green-50/30 text-center"><BooleanIcon value={lang.translate} /></td>
                                        <td className="p-4 bg-blue-50/30 text-center"><BooleanIcon value={lang.desktop} /></td>
                                        <td className="p-4 bg-yellow-50/30 text-center"><BooleanIcon value={lang.mobile} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden p-4 space-y-4">
                        {inPersonLanguages.map((lang, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="font-bold text-lg mb-3 pb-2 border-b border-gray-200 text-gray-900">
                                    {index + 1}. {lang.name}
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('helpSupport:supportedLanguages.mobileLabels.translation')}</span>
                                        <SupportLabel supported={lang.translate} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('helpSupport:supportedLanguages.mobileLabels.desktop')}</span>
                                        <SupportLabel supported={lang.desktop} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('helpSupport:supportedLanguages.mobileLabels.mobile')}</span>
                                        <SupportLabel supported={lang.mobile} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table 2: Detailed Feature Support */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-[#f0f4fe]">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Monitor size={20} className="text-indigo-600" />
                            {t('helpSupport:detailedFeatures.title')}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">{t('helpSupport:detailedFeatures.subtitle')}</p>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600">
                                    <th rowSpan="2" className="p-4 font-bold text-center border-r border-gray-200">{t('helpSupport:detailedFeatures.headers.rank')}</th>
                                    <th rowSpan="2" className="p-4 font-bold border-r border-gray-200">{t('helpSupport:detailedFeatures.headers.language')}</th>
                                    <th rowSpan="2" className="p-4 font-bold text-center bg-green-50 border-r border-gray-200" dangerouslySetInnerHTML={{ __html: t('helpSupport:detailedFeatures.headers.translation').replace(/\n/g, '<br/>') }} />
                                    <th colSpan="2" className="p-4 font-bold text-center bg-blue-50 border-r border-gray-200">{t('helpSupport:detailedFeatures.headers.desktopVersion')}</th>
                                    <th colSpan="2" className="p-4 font-bold text-center bg-yellow-50">{t('helpSupport:detailedFeatures.headers.mobileApp')}</th>
                                </tr>
                                <tr className="bg-white text-xs font-semibold text-gray-500 border-b border-gray-200">
                                    <th className="p-3 text-center bg-blue-50/50">{t('helpSupport:detailedFeatures.headers.voiceInput')}</th>
                                    <th className="p-3 text-center bg-blue-50/50 border-r border-gray-200">{t('helpSupport:detailedFeatures.headers.tts')}</th>
                                    <th className="p-3 text-center bg-yellow-50/50">{t('helpSupport:detailedFeatures.headers.voiceInput')}</th>
                                    <th className="p-3 text-center bg-yellow-50/50">{t('helpSupport:detailedFeatures.headers.tts')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {detailedLanguages.map((lang, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-center text-gray-500 border-r border-gray-100">{index + 1}</td>
                                        <td className="p-4 font-medium border-r border-gray-100">{lang.name}</td>
                                        <td className="p-4 bg-green-50/30 text-center border-r border-gray-100"><BooleanIcon value={lang.translate} /></td>
                                        <td className="p-4 bg-blue-50/30 text-center"><BooleanIcon value={lang.voiceDesktop} /></td>
                                        <td className="p-4 bg-blue-50/30 text-center border-r border-gray-100"><BooleanIcon value={lang.ttsDesktop} /></td>
                                        <td className="p-4 bg-yellow-50/30 text-center"><BooleanIcon value={lang.voiceMobile} /></td>
                                        <td className="p-4 bg-yellow-50/30 text-center"><BooleanIcon value={lang.ttsMobile} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden p-4 space-y-4">
                        {detailedLanguages.map((lang, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="font-bold text-lg mb-3 pb-2 border-b border-gray-200 text-gray-900">
                                    {index + 1}. {lang.name}
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">{t('helpSupport:detailedFeatures.mobileHeaders.translation')}</span>
                                        <SupportLabel supported={lang.translate} />
                                    </div>

                                    <div className="pt-1">
                                        <p className="text-xs font-bold text-blue-600 uppercase mb-2">{t('helpSupport:detailedFeatures.mobileHeaders.desktop')}</p>
                                        <div className="space-y-2 pl-2 border-l-2 border-blue-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">{t('helpSupport:detailedFeatures.headers.voiceInput')}</span>
                                                <SupportLabel supported={lang.voiceDesktop} />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">{t('helpSupport:detailedFeatures.headers.tts')}</span>
                                                <SupportLabel supported={lang.ttsDesktop} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-xs font-bold text-yellow-600 uppercase mb-2">{t('helpSupport:detailedFeatures.mobileHeaders.mobile')}</p>
                                        <div className="space-y-2 pl-2 border-l-2 border-yellow-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">{t('helpSupport:detailedFeatures.headers.voiceInput')}</span>
                                                <SupportLabel supported={lang.voiceMobile} />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">{t('helpSupport:detailedFeatures.headers.tts')}</span>
                                                <SupportLabel supported={lang.ttsMobile} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
