import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  User,
  ChevronDown,
  HelpCircle,
  LogOut,
  Lock
} from 'lucide-react';
import { useSessionContext } from '../../context/SessionContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const Header = ({ onMenuClick }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // notifications and unreadCount now come from context
  const { notifications, unreadCount } = useNotification();
  const { logout, user } = useAuth();
  const { isEnglish, toggleLanguage, preferredLanguage } = useLanguage();
  const { t } = useTranslation();
  const { requestNavigation } = useSessionContext();
  const location = useLocation();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No need for local fetch or socket listeners here anymore
  // The Context handles it all!

  const handleLogout = () => {
    if (requestNavigation('/login')) {
      logout();
    }
    // If navigation blocked, modal appears. On confirm, it navigates to /login.
    // Ideally we'd call logout() too but landing on /login is sufficient for now.
  };

  const getSenderName = (conv) => {
    if (user?.role === 'teacher') {
      return `${conv.student_first_name} ${conv.student_last_name}`;
    }
    return `${conv.teacher_first_name || 'Teacher'} ${conv.teacher_last_name || ''}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getProfilePath = () => {
    if (user?.role === 'super admin' || user?.role === 'super_admin') return '/super-admin/profile';
    if (user?.role === 'admin') return '/admin/profile';
    if (user?.role === 'student') return '/student/profile';
    if (user?.role === 'teacher') return '/teacher/profile';
    return '/profile'; // Default or fallback
  };

  const getRoleLabel = () => {
    if (user?.role === 'super admin' || user?.role === 'super_admin') return 'Super Admin';
    if (user?.role === 'admin') return 'School Admin';
    if (user?.role === 'teacher') return 'Teacher';
    if (user?.role === 'student') return 'Student';
    return 'User';
  };

  const getSectionLabel = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    const section = parts[1] || parts[0] || 'dashboard';
    return section
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <header className="sticky top-0 z-50 h-16 bg-white/95 border-b border-slate-200 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="h-full flex items-center">
        <div className="px-4 md:px-6 w-full">
          <div className="flex items-center justify-between">

            {/* Left Section - Menu Button */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onMenuClick}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                aria-label="Toggle sidebar"
              >
                <Menu size={18} />
              </button>

              <div className="hidden sm:block min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{getRoleLabel()}</p>
                <p className="truncate text-sm font-semibold text-slate-900">{getSectionLabel()}</p>
              </div>
            </div>

            {/* Right Section - Language Toggle, Notifications and Profile */}
            <div className="flex items-center gap-2">

              {/* Language Toggle Switch - Only for Students */}
              {user?.role === 'student' && (
                <div className="relative hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-2 shadow-sm">
                  <span className="text-xs font-medium text-slate-600 min-w-[120px]">
                    {isEnglish ? 'Switch to Your Language' : t('header:language.switchToEnglish')}
                  </span>
                  <button
                    onClick={toggleLanguage}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isEnglish ? 'bg-slate-300' : 'bg-primary-600'
                      }`}
                    title={isEnglish ? `Switch to ${preferredLanguage}` : 'Switch to English'}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEnglish ? 'translate-x-0.5' : 'translate-x-5'
                        }`}
                    />
                  </button>
                </div>
              )}

              {/* Notifications - Hidden for Admin and Super Admin */}
              {user?.role !== 'admin' && user?.role !== 'super admin' && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setNotificationOpen(!notificationOpen);
                      setProfileOpen(false);
                    }}
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    title="Notifications"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-md border border-slate-200 z-50 overflow-hidden animate-fade-in origin-top-right">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                        <h3 className="text-sm font-semibold text-slate-900">{t('header:notifications.title')}</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-full border border-primary-100">
                            {unreadCount} {t('header:notifications.unread')}
                          </span>
                        )}
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                              <Bell size={20} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-medium">{t('header:notifications.empty')}</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map(conv => (
                            <div key={conv.id} className={`p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer relative group ${parseInt(conv.unread_count) > 0 ? 'bg-primary-50/40' : ''}`}
                              onClick={() => {
                                const path = user?.role === 'student' ? '/student/conversations' : '/teacher/conversations';
                                requestNavigation(`${path}?id=${conv.id}`);
                                setNotificationOpen(false);
                              }}>
                              <div className="flex gap-3">
                                {/* Unread Indicator Dot */}
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${parseInt(conv.unread_count) > 0 ? 'bg-primary-600' : 'bg-transparent'}`} />

                                <div className="space-y-0.5 flex-1 min-w-0">
                                  {/* Sender Name */}
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {getSenderName(conv)}
                                  </p>

                                  {/* Message Preview */}
                                  <p className="text-xs text-slate-500 line-clamp-1">
                                    {(() => {
                                      const showNative = !isEnglish;
                                      const previewText = showNative
                                        ? (conv.last_message_translated || conv.last_message)
                                        : conv.last_message;
                                      return previewText?.replace(/<[^>]*>?/gm, '') || t('header:notifications.newMessage');
                                    })()}
                                  </p>

                                  {/* Time */}
                                  <p className="text-xs text-slate-400 font-medium">
                                    {formatTime(conv.updated_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-2 bg-slate-50/80 border-t border-slate-100">
                          <button
                            onClick={() => {
                              const role = user?.role || 'student';
                              requestNavigation(`/${role}/conversations`);
                              setNotificationOpen(false);
                            }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 text-sm font-semibold rounded-lg hover:bg-primary-600 hover:text-white transition-colors">
                            {t('header:notifications.viewAll')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotificationOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-slate-200 hover:bg-slate-50"
                  title="Profile"
                  aria-label="Profile menu"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-600 p-[2px] shadow-sm">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                      {user?.profile_image && (user.profile_image.startsWith('data:') || user.profile_image.startsWith('http')) ? (
                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-primary-700 relative z-10">
                          {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden md:block text-left leading-tight">
                    <p className="max-w-28 truncate text-sm font-medium text-slate-800">
                      {user?.firstName || user?.username || 'Account'}
                    </p>
                    <p className="text-xs text-slate-400">{getRoleLabel()}</p>
                  </div>
                  <ChevronDown size={14} className={`hidden md:block text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-md border border-slate-200 z-50 overflow-hidden animate-fade-in origin-top-right">
                    {/* Profile Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${user?.role === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          user?.role === 'teacher' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-purple-50 text-purple-600 border-purple-100'
                          }`}>
                          {getRoleLabel()}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 gap-1 flex flex-col">
                      <button
                        onClick={() => {
                          requestNavigation(getProfilePath());
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors group w-full text-left rounded-lg"
                      >
                        <User size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                        {t('header:myProfile')}
                      </button>

                      {/* Settings Link - Only show for students/teachers? Or all? */}
                      {/* Assuming Settings links to ChangePassword as per previous audit */}
                      <button
                        onClick={() => {
                          const path = (user?.role === 'super admin' || user?.role === 'super_admin') ? '/super-admin/change-password' :
                            user?.role === 'admin' ? '/admin/settings' :
                              `/${user?.role}/settings`;
                          requestNavigation(path);
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors group w-full text-left rounded-lg"
                      >
                        <Lock size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                        {t('header:changePassword')}
                      </button>

                      {(user?.role !== 'super admin' && user?.role !== 'super_admin') && (
                        <button
                          onClick={() => {
                            requestNavigation('/help');
                            setProfileOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors group w-full text-left rounded-lg"
                        >
                          <HelpCircle size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                          {t('header:helpSupport')}
                        </button>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/80">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors shadow-sm text-sm font-semibold"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
