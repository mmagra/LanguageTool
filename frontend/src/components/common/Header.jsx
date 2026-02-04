import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Clock,
  CheckCircle,
  X,
  Languages,
  Lock,
  Globe
} from 'lucide-react';
import { useSessionContext } from '../../context/SessionContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const Header = ({ onMenuClick, sidebarCollapsed }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // notifications and unreadCount now come from context
  const { notifications, unreadCount, fetchNotifications } = useNotification();
  const { logout, user } = useAuth();
  const { socket } = useSocket();
  const { isEnglish, toggleLanguage, preferredLanguage } = useLanguage();
  const { t } = useTranslation();
  const { requestNavigation } = useSessionContext(); // Import this
  const location = useLocation();
  const navigate = useNavigate();
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
    if (user?.role === 'super_admin') return '/super-admin/profile';
    if (user?.role === 'admin') return '/admin/profile';
    if (user?.role === 'student') return '/student/profile';
    if (user?.role === 'teacher') return '/teacher/profile';
    return '/profile'; // Default or fallback
  };

  return (
    <header className="sticky top-0 z-50 bg-indigo-50/80 backdrop-blur-xl border-b border-indigo-100 shadow-sm transition-all duration-300">
      {/* Increased by 0.5px - from 71px to 71.5px */}
      <div className="h-[71.5px] flex items-center">
        <div className="px-4 md:px-6 w-full">
          <div className="flex items-center justify-between">

            {/* Left Section - Menu Button */}
            <div className="flex items-center">
              <button
                onClick={onMenuClick}
                className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors shadow-sm border border-indigo-100"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} className="text-indigo-900" />
              </button>
            </div>

            {/* Right Section - Language Toggle, Notifications and Profile */}
            <div className="flex items-center gap-2">

              {/* Language Toggle Switch - Only for Students */}
              {user?.role === 'student' && (
                <div className="relative flex items-center gap-2 bg-white rounded-full px-3 py-1.5 pr-2 border border-indigo-100 shadow-sm mr-1">
                  <span className="text-xs font-medium text-gray-700 min-w-[120px]">
                    {isEnglish ? 'Switch to Your Language' : t('header:language.switchToEnglish')}
                  </span>
                  <button
                    onClick={toggleLanguage}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnglish ? 'bg-gray-300' : 'bg-indigo-600'
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
              {user?.role !== 'admin' && user?.role !== 'super_admin' && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setNotificationOpen(!notificationOpen);
                      setProfileOpen(false);
                    }}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors relative"
                    title="Notifications"
                  >
                    <Bell size={20} className="text-[#123869] hover:text-[#1d4370]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-indigo-50 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">{t('header:notifications.title')}</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                            {unreadCount} {t('header:notifications.unread')}
                          </span>
                        )}
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                              <Bell size={20} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-medium">{t('header:notifications.empty')}</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map(conv => (
                            <div key={conv.id} className={`p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer relative group ${parseInt(conv.unread_count) > 0 ? 'bg-indigo-50/40' : ''}`}
                              onClick={() => {
                                const path = user?.role === 'student' ? '/student/conversations' : '/teacher/conversations';
                                requestNavigation(`${path}?id=${conv.id}`);
                                setNotificationOpen(false);
                              }}>
                              <div className="flex gap-3">
                                {/* Unread Indicator Dot */}
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${parseInt(conv.unread_count) > 0 ? 'bg-indigo-600' : 'bg-transparent'}`} />

                                <div className="space-y-0.5 flex-1 min-w-0">
                                  {/* Sender Name */}
                                  <p className="text-sm font-bold text-gray-900 truncate">
                                    {getSenderName(conv)}
                                  </p>

                                  {/* Message Preview */}
                                  <p className="text-xs text-gray-500 line-clamp-1">
                                    {(() => {
                                      const showNative = !isEnglish;
                                      const previewText = showNative
                                        ? (conv.last_message_translated || conv.last_message)
                                        : conv.last_message;
                                      return previewText?.replace(/<[^>]*>?/gm, '') || t('header:notifications.newMessage');
                                    })()}
                                  </p>

                                  {/* Time */}
                                  <p className="text-[10px] text-gray-400 font-medium">
                                    {formatTime(conv.updated_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-2 bg-gray-50/50 border-t border-gray-100">
                          <button
                            onClick={() => {
                              const role = user?.role || 'student';
                              requestNavigation(`/${role}/conversations`);
                              setNotificationOpen(false);
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all shadow-sm">
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
                  className="flex items-center gap-2 p-1.5 hover:bg-indigo-50 rounded-full transition-colors border border-transparent hover:border-indigo-100"
                  title="Profile"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] p-[2px] shadow-sm">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                      {user?.profile_image && (user.profile_image.startsWith('data:') || user.profile_image.startsWith('http')) ? (
                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] relative z-10">
                          {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
                    {/* Profile Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${user?.role === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          user?.role === 'teacher' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-purple-50 text-purple-600 border-purple-100'
                          }`}>
                          {user?.role ? t(`roles:${user.role}`) : user?.role || 'User'}
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
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors group w-full text-left"
                      >
                        <User size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                        {t('header:myProfile')}
                      </button>

                      {/* Settings Link - Only show for students/teachers? Or all? */}
                      {/* Assuming Settings links to ChangePassword as per previous audit */}
                      <button
                        onClick={() => {
                          const path = user?.role === 'super_admin' ? '/super-admin/change-password' :
                            user?.role === 'admin' ? '/admin/settings' :
                              `/${user?.role}/settings`;
                          requestNavigation(path);
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors group w-full text-left"
                      >
                        <Lock size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                        {t('header:changePassword')}
                      </button>

                      <button
                        onClick={() => {
                          requestNavigation('/help');
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors group w-full text-left"
                      >
                        <HelpCircle size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                        {t('header:helpSupport')}
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-gray-50 bg-gray-50/30">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm text-sm font-semibold"
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

// Need to import missing icons
const FileText = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const Shield = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);

export default Header;