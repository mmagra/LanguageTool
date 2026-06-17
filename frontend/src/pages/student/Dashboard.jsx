import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Check, X, MessageSquare, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [studentInfo, setStudentInfo] = useState(null);
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

    const fetchStudentInfo = async () => {
      if (!user?.id) return;
      try {
        const res = await api.get(`/students/${user.id}`);
        if (res.success) setStudentInfo(res.data);
      } catch (error) {
        console.error('Error fetching student info:', error);
      }
    };

    fetchDashboardStats();
    fetchStudentInfo();
  }, [user?.id]);

  const studentName = studentInfo
    ? `${studentInfo.first_name || ''} ${studentInfo.last_name || ''}`.trim()
    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const guardianName = studentInfo?.guardian_name?.trim();
  const gradeName = studentInfo?.grade_name;

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
      title: 'Student Details',
      value: studentName || 'Student',
      icon: GraduationCap,
      color: 'bg-primary-50 text-primary-600',
      subText: gradeName ? `Grade ${gradeName}` : 'Grade not assigned'
    },

  ];

  const quickActions = [
    {
      title: t('sidebar:conversations'),
      label: 'Messages',
      description: 'Read and reply to translated teacher messages.',
      icon: MessageSquare,
      to: '/student/conversations',
      tone: 'bg-primary-50 text-primary-600'
    },
    {
      title: t('sidebar:inPerson'),
      label: 'Live',
      description: 'Join a live translated conversation when invited.',
      icon: Users,
      to: '/student/live-conversation',
      tone: 'bg-emerald-50 text-emerald-600'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome{guardianName ? `, ${guardianName}` : ''}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            Stay connected with teachers through translated messages and live conversations.
          </p>
        </div>
        <div className="app-date-pill self-start md:self-auto">
          {new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="app-card app-card-hover p-5">
              <div className="flex items-center gap-4">
                <div className={`app-icon-tile ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="app-eyebrow">{stat.title}</p>
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 leading-tight mt-1 truncate">
                    {stat.value}
                  </h3>
                </div>
              </div>
              <p className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {stat.subText}
              </p>
            </div>
          );
        })}
      </div>

      <div>
        <div className="mb-4">
          <p className="app-eyebrow">Start here</p>
          <h2 className="app-section-title mt-1">Communication tools</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.to} className="app-card app-card-hover p-6 block">
                <div className="flex items-start justify-between gap-4">
                  <div className={`app-icon-tile ${action.tone}`}>
                    <Icon size={20} />
                  </div>
                  <span className="app-eyebrow">{action.label}</span>
                </div>
                <h3 className="mt-5 text-sm font-semibold text-slate-900">{action.title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>


      {/* Language Support Status Card */}
      <div className="app-card">
        <div className="p-6">
          {/* Section heading */}
          <div className="mb-6">
            <p className="app-eyebrow mb-1.5">
              {t('dashboard:languageStatus.title')}
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {t('dashboard:languageStatus.primary')} <span className="text-primary-600">{localizedPrimaryLanguage}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Written Support */}
            <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div className={`app-icon-tile ${isWrittenSupported ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <MessageCircle size={20} />
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isWrittenSupported ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {isWrittenSupported ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                  {isWrittenSupported ? t('dashboard:languageStatus.written.available') : t('dashboard:languageStatus.written.unsupported')}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mt-4">{t('dashboard:languageStatus.written.title')}</h4>
            </div>

            {/* Verbal Support */}
            <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div className={`app-icon-tile ${isVerbalSupported ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <Users size={20} />
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isVerbalSupported ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {isVerbalSupported ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                  {isVerbalSupported ? t('dashboard:languageStatus.verbal.available') : t('dashboard:languageStatus.verbal.unsupported')}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mt-4">{t('dashboard:languageStatus.verbal.title')}</h4>
            </div>

          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;
