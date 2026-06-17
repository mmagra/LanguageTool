import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { PhoneIncoming, Phone, X, Play } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import TeacherSidebar from './TeacherSidebar';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState(null);

  // Choose sidebar based on role
  const SidebarComponent = user?.role === 'teacher' ? TeacherSidebar : Sidebar;

  // --- SOCKET LISTENERS (GLOBAL) ---
  useEffect(() => {
    if (!socket || !user) return;

    const handleInvite = (data) => {
      setIncomingInvite(data);
      // Play ringtone here if desired
    };

    const handleCancelled = () => {
      setIncomingInvite(null);
    };

    socket.on('session_invite', handleInvite);
    socket.on('session_cancelled', handleCancelled);
    socket.on('session_declined', handleCancelled); // clear the modal when the student declines

    return () => {
      socket.off('session_invite', handleInvite);
      socket.off('session_cancelled', handleCancelled);
      socket.off('session_declined', handleCancelled);
    };
  }, [socket, user]);

  const handleAcceptInvite = () => {
    if (socket && incomingInvite) {
      const { roomId } = incomingInvite;
      // Navigate to the communication page with state
      navigate('/student/live-conversation', {
        state: {
          autoJoinRoomId: roomId,
          teacherName: incomingInvite.teacherName,
          teacherImage: incomingInvite.teacherImage
        }
      });
      setIncomingInvite(null);
    }
  };

  const handleDeclineInvite = () => {
    if (socket && incomingInvite) {
      socket.emit('session_declined', {
        roomId: incomingInvite.roomId
      });
    }
    setIncomingInvite(null);
  };

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed(!sidebarCollapsed);
      setMobileSidebarOpen(false);
    } else {
      setMobileSidebarOpen(!mobileSidebarOpen);
    }
  };

  const handleSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-app-bg text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block">
        <SidebarComponent
          isOpen={true}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
          onClose={() => { }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          onMenuClick={handleMenuClick}
          sidebarCollapsed={sidebarCollapsed}
          isMobileSidebarOpen={mobileSidebarOpen}
        />

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={handleSidebarClose}
            />
            <div className="fixed inset-y-0 left-0 z-[70]">
              <SidebarComponent
                isOpen={mobileSidebarOpen}
                onClose={handleSidebarClose}
                collapsed={false}
              />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="py-8 px-6 md:px-8 lg:px-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* INCOMING INVITE GLOBAL MODAL */}
      {incomingInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-8 sm:p-10 m-4 animate-scale-in text-center relative overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">

            {/* Title */}
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-8">Live Conversation Request</h2>

            {/* Teacher Avatar */}
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-white border border-slate-200 flex items-center justify-center relative overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-700">
              {incomingInvite.teacherImage ? (
                <img
                  src={incomingInvite.teacherImage}
                  alt={incomingInvite.teacherName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-primary-700">
                  {incomingInvite.teacherName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T'}
                </span>
              )}
            </div>

            <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">{incomingInvite.teacherName}</span> is inviting you to a live conversation.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleDeclineInvite}
                className="w-full px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900 dark:hover:bg-red-950/50"
              >
                <X size={20} />
                Decline
              </button>
              <button
                onClick={handleAcceptInvite}
                className="w-full px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Play size={20} fill="currentColor" />
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
