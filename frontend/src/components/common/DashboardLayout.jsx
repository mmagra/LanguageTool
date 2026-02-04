import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { PhoneIncoming, Phone, X, Play } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
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
      console.log("📲 Global Incoming Invite:", data);
      setIncomingInvite(data);
      // Play ringtone here if desired
    };

    const handleCancelled = () => {
      console.log("❌ Session cancelled by teacher");
      setIncomingInvite(null);
    };

    socket.on('session_invite', handleInvite);
    socket.on('session_cancelled', handleCancelled);

    return () => {
      socket.off('session_invite', handleInvite);
      socket.off('session_cancelled', handleCancelled);
    };
  }, [socket, user]);

  const handleAcceptInvite = () => {
    if (socket && incomingInvite) {
      const { roomId } = incomingInvite;
      // Navigate to the communication page with state
      navigate('/student/in-person', {
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
    <div className="flex h-screen bg-slate-50/50">
      <Toaster position="top-right" />

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
              className="fixed inset-0 bg-black/50"
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
          <div className="min-h-full flex flex-col">
            <div className="flex-1 py-8 px-12 md:py-12 md:px-24">
              <div className="max-w-8xl mx-auto">
                {children}
              </div>
            </div>
            <div className="mt-auto">
              <Footer />
            </div>
          </div>
        </main>
      </div>

      {/* INCOMING INVITE GLOBAL MODAL */}
      {incomingInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-10 m-4 animate-scale-in text-center relative overflow-hidden">

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-8">In-Person Session Request</h2>

            {/* Teacher Avatar with Gradient Border */}
            <div className="mx-auto mb-6 w-28 h-28 rounded-full bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] p-[4px] shadow-lg">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                {incomingInvite.teacherImage ? (
                  <img
                    src={incomingInvite.teacherImage}
                    alt={incomingInvite.teacherName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b]">
                    {incomingInvite.teacherName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T'}
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-500 mb-10 text-lg">
              <span className="font-bold text-gray-800">{incomingInvite.teacherName}</span> is inviting you to join an in-person session.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleDeclineInvite}
                className="w-full px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <X size={20} />
                Decline
              </button>
              <button
                onClick={handleAcceptInvite}
                className="w-full px-6 py-2.5 bg-primary-100/50 text-primary-700 font-bold rounded-2xl hover:bg-primary-700 hover:text-white hover:shadow-md transition-all flex items-center justify-center gap-2 shadow-sm"
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