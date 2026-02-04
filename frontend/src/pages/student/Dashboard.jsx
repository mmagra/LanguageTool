import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Users, MessageCircle, Globe, Languages, Check, X, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';



const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const { availableLanguages, preferredLangCode, preferredLanguage } = useLanguage();

  const [dashboardStats, setDashboardStats] = useState({
    teacherCount: 0,
    conversationCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Dynamic status checks
  const isWrittenSupported = true; // All active languages support messaging
  let isVerbalSupported = false;

  // Find current language in available list to check speech code
  const currentLangObj = availableLanguages.find(l => l.code === preferredLangCode);
  if (currentLangObj && currentLangObj.speech_code) {
    isVerbalSupported = true;
  } else if (preferredLangCode === 'en') {
    isVerbalSupported = true; // English is always supported
  }

  // Calculate counts for stats
  const writtenCount = availableLanguages.length;
  // Count how many have speech_code (exclude ones without it)
  const verbalCount = availableLanguages.filter(l => l.speech_code).length;


  // Get localized language name
  const getLocalizedLanguageName = (langName) => {
    try {
      const currentLocale = i18n.language || 'en';
      const displayNames = new Intl.DisplayNames([currentLocale], { type: 'language' });
      // We need code here.
      // If langName is passed, try to find code in Available
      const found = availableLanguages.find(l => l.name === langName);
      const code = found ? found.code : 'en';

      return displayNames.of(code) || langName;
    } catch (error) {
      console.error("Error localizing language name:", error);
      return langName;
    }
  };

  const localizedPrimaryLanguage = getLocalizedLanguageName(preferredLanguage);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/students/dashboard-stats');
        console.log('Dashboard stats response:', response);
        if (response.success) {
          setDashboardStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Dashboard stats with dynamic data
  const stats = [
    {
      title: t('dashboard:stats.teachers'),
      value: loading ? '...' : dashboardStats.teacherCount.toString(),
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
      subText: t('dashboard:stats.teachersSubText')
    },
    {
      title: t('dashboard:stats.conversations'),
      value: loading ? '...' : dashboardStats.conversationCount.toString(),
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-600',
      subText: t('dashboard:stats.conversationsSubText')
    },
    {
      title: t('dashboard:stats.languages'),
      value: '108',
      icon: Languages,
      color: 'bg-indigo-50 text-indigo-600',
      subText: t('dashboard:stats.languagesSubText', { written: writtenCount, verbal: verbalCount })
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t('dashboard:title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('dashboard:subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200/60">
            {new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</span>
              </div>
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
              </div>
              <div className="pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
                {stat.subText}
              </div>
            </div>
          );
        })}
      </div>


      {/* Language Support Status Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden w-full">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* Primary Language - Takes 2 columns */}
            <div className="md:col-span-2 p-6 h-full flex flex-col justify-center">
              <h2 className="text-lg font-bold text-gray-700 mb-2">{t('dashboard:languageStatus.title')}</h2>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                {t('dashboard:languageStatus.primary')} <span className="text-indigo-600 border-b-2 border-indigo-200">{localizedPrimaryLanguage}</span>
              </h3>
            </div>

            {/* Written Support - Takes 1 column */}
            <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-xl ${isWrittenSupported ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'}`}>
              <div className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl ${isWrittenSupported ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      <MessageCircle className={isWrittenSupported ? 'text-emerald-600' : 'text-red-600'} size={20} />
                    </div>
                    {isWrittenSupported ?
                      <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg"><Check size={18} strokeWidth={3} /></div> :
                      <div className="bg-red-500 text-white p-1.5 rounded-full shadow-lg"><X size={18} strokeWidth={3} /></div>
                    }
                  </div>
                  <h4 className="font-bold text-gray-900 text-base mb-2">{t('dashboard:languageStatus.written.title')}</h4>
                  <p className={`text-xs font-semibold ${isWrittenSupported ? 'text-emerald-700' : 'text-red-700'}`}>
                    {isWrittenSupported ? t('dashboard:languageStatus.written.available') : t('dashboard:languageStatus.written.unsupported')}
                  </p>
                </div>
              </div>
            </div>

            {/* Verbal Support - Takes 1 column */}
            <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-xl ${isVerbalSupported ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'}`}>
              <div className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl ${isVerbalSupported ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      <Users className={isVerbalSupported ? 'text-emerald-600' : 'text-red-600'} size={20} />
                    </div>
                    {isVerbalSupported ?
                      <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg"><Check size={18} strokeWidth={3} /></div> :
                      <div className="bg-red-500 text-white p-1.5 rounded-full shadow-lg"><X size={18} strokeWidth={3} /></div>
                    }
                  </div>
                  <h4 className="font-bold text-gray-900 text-base mb-2">{t('dashboard:languageStatus.verbal.title')}</h4>
                  <p className={`text-xs font-semibold ${isVerbalSupported ? 'text-emerald-700' : 'text-red-700'}`}>
                    {isVerbalSupported ? t('dashboard:languageStatus.verbal.available') : t('dashboard:languageStatus.verbal.unsupported')}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;
