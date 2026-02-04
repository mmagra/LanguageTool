import React, { useRef } from 'react';
import { MessageCircle, Search, User, Shield, GraduationCap, Languages, Heart, ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import RichTextEditor from '../../components/common/RichTextEditor';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminChats = () => {
    const { user } = useAuth();
    const chatContainerRef = useRef(null);
    const prevScrollHeightRef = useRef(0);
    const userScrolledAwayRef = useRef(false);

    // Use admin role for the hook
    const {
        conversations,
        loadingConversations,
        selectedChat,
        setSelectedChat,
        messages,
        loadingMessages,
        sendMessage,
        sending,
        searchTerm,
        setSearchTerm,
        refreshConversations,
        loadMore,
        hasMore,
        otherUserTyping,
        handleTypingInput
    } = useChat('admin');

    const [messageInput, setMessageInput] = React.useState('');
    const [showDeleteModal, setShowDeleteModal] = React.useState(false); // Modal state

    const handleSend = async () => {
        if (!messageInput.trim()) return;
        const success = await sendMessage(messageInput);
        if (success) {
            setMessageInput('');
        }
    };

    const handleDeleteClick = () => {
        if (!selectedChat) return;
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedChat) return;

        try {
            await api.delete(`/messages/conversations/${selectedChat.id}`);
            toast.success('Conversation deleted successfully');
            setShowDeleteModal(false); // Close modal
            setSelectedChat(null);
            refreshConversations();
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            toast.error('Failed to delete conversation');
            setShowDeleteModal(false);
        }
    };

    // --- Identical scroll logic from Conversations.jsx ---
    React.useEffect(() => {
        prevScrollHeightRef.current = 0;
        userScrolledAwayRef.current = false;
    }, [selectedChat?.id]);

    React.useLayoutEffect(() => {
        if (chatContainerRef.current && messages.length > 0) {
            const container = chatContainerRef.current;
            const isAtBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 50;
            const isFirstLoad = prevScrollHeightRef.current === 0;

            const lastMessage = messages[messages.length - 1];
            // Fix: sender can be anyone in admin view, check logic if needed
            // For now, if "ME" (admin) sent it, scroll. 
            // If we are monitoring, "user.id" might not be sender.
            // But if we want auto-scroll on new message regardless of sender, check if last msg is newer?
            // Sticking to standard behavior:
            const isOwnMessage = lastMessage && lastMessage.sender_id === user.id;

            if (isFirstLoad) {
                container.style.scrollBehavior = 'auto';
                container.scrollTop = container.scrollHeight;
                prevScrollHeightRef.current = container.scrollHeight;
                userScrolledAwayRef.current = false;
                setTimeout(() => {
                    container.style.scrollBehavior = 'smooth';
                }, 0);
            } else if (isOwnMessage || (!userScrolledAwayRef.current && isAtBottom) || (isAtBottom)) {
                container.style.scrollBehavior = 'auto';
                container.scrollTop = container.scrollHeight;
                prevScrollHeightRef.current = container.scrollHeight;
                userScrolledAwayRef.current = false;
                setTimeout(() => {
                    container.style.scrollBehavior = 'smooth';
                }, 0);
            } else {
                const oldScrollHeight = prevScrollHeightRef.current;
                const newScrollHeight = container.scrollHeight;
                const scrollDiff = newScrollHeight - oldScrollHeight;

                if (scrollDiff > 0 && container.scrollTop < 100) {
                    container.style.scrollBehavior = 'auto';
                    container.scrollTop = container.scrollTop + scrollDiff;
                    setTimeout(() => {
                        container.style.scrollBehavior = 'smooth';
                    }, 0);
                }
                prevScrollHeightRef.current = newScrollHeight;
            }
        }
    }, [messages, user.id]);

    React.useEffect(() => {
        if (!chatContainerRef.current) return;
        const container = chatContainerRef.current;
        const resizeObserver = new ResizeObserver(() => {
            if (!userScrolledAwayRef.current) {
                container.scrollTop = container.scrollHeight;
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [selectedChat?.id]);



    const handleScroll = (e) => {
        const container = e.target;
        const isAtBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 50;
        userScrolledAwayRef.current = !isAtBottom;
        if (container.scrollTop === 0 && hasMore && !loadingMessages) {
            loadMore();
        }
    };
    // ----------------------------------------------------

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const stripHtml = (html) => {
        if (!html) return '';
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const DetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg shrink-0">
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xs font-semibold text-slate-800 truncate">{value || 'N/A'}</p>
            </div>
        </div>
    );

    // Helpers to display Admin View data properly
    // In "Monitor" mode, we typically want to see "Student Name vs Teacher Name"
    // But standard chat UI is "Active Chat: Name".
    // Let's decide how to label the sidebar items.
    // We'll show "Student Name" as primary, maybe "with Teacher Name" as secondary?
    const getSidebarTitle = (conv) => {
        const sName = conv.student_first_name ? `${conv.student_first_name} ${conv.student_last_name}` : 'Unknown Student';
        const tName = conv.teacher_first_name ? `${conv.teacher_first_name} ${conv.teacher_last_name}` : 'Unknown Teacher';
        return { sName, tName };
    };

    return (
        <ProtectedRoute roles={['admin']}>
            <div className="h-[calc(100dvh-80px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden font-inter">

                {/* Sidebar */}
                <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-slate-100 flex-col bg-white z-20`}>
                    <div className="p-5 border-b border-slate-50 bg-white">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Monitor Chats</h2>
                            {/* Maybe a filter icon here later */}
                        </div>

                        <div className="relative group">
                            <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by student or teacher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary-200 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all placeholder-slate-400 text-slate-800 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 space-y-0 custom-scrollbar bg-white">
                        {loadingConversations && conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                                <p className="text-slate-400 text-sm font-medium">Loading conversations...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-12 px-6">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <MessageCircle size={20} className="text-slate-300" />
                                </div>
                                <p className="text-slate-800 font-medium text-sm">No chats found</p>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const { sName, tName } = getSidebarTitle(conv);
                                const isActive = selectedChat?.id === conv.id;
                                const unreadCount = parseInt(conv.unread_count || 0);

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedChat(conv)}
                                        className={`p-4 border-b border-slate-50 cursor-pointer transition-all duration-200 flex gap-3 group relative overflow-hidden
                                        ${isActive ? 'bg-primary-50/50' : 'hover:bg-slate-50'}`}
                                    >
                                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary-500 rounded-r-full animate-fade-in"></div>}

                                        {/* Avatar Stack: Teacher First, consistent with "Teacher Name First" request */}
                                        <div className="relative shrink-0">
                                            {conv.teacher_profile_image ? (
                                                <img
                                                    src={conv.teacher_profile_image}
                                                    alt={tName}
                                                    className={`w-12 h-12 rounded-full object-cover shadow-sm transition-all group-hover:scale-105 ${isActive ? 'ring-2 ring-primary-100' : 'border border-slate-100'
                                                        }`}
                                                />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all group-hover:scale-105
                                                ${isActive ? 'bg-gradient-to-br from-primary-600 to-indigo-600 text-white shadow-primary-500/20' : 'bg-slate-100 text-slate-500'}`}>
                                                    {conv.teacher_first_name?.[0]}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="min-w-0 flex-1 mr-2">
                                                    <div className="flex items-center gap-1.5 ">
                                                        {/* Swapped: Teacher Name is Primary */}
                                                        <span className={`font-bold text-sm truncate ${isActive ? 'text-primary-900' : 'text-slate-800'}`}>
                                                            {tName}
                                                        </span>
                                                        <span className="text-xs text-slate-400">with</span>
                                                    </div>
                                                    {/* Swapped: Student Name is Secondary */}
                                                    <span className="text-xs font-semibold text-indigo-600 truncate block mt-0.5">
                                                        {sName}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-medium whitespace-nowrap px-1.5 py-0.5 rounded-full ${unreadCount > 0 ? 'text-green-700 bg-green-50' : 'text-slate-400 bg-slate-50'}`}>
                                                    {formatTime(conv.updated_at)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center gap-2 mt-1">
                                                <p className={`text-xs truncate leading-relaxed flex-1 ${isActive ? 'text-primary-700/80 font-medium' : unreadCount > 0 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                                                    {stripHtml(conv.last_message) || 'No messages yet'}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="shrink-0 bg-green-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-sm">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50/30 relative z-10`}>
                    {selectedChat ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Header */}
                            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
                                <div className="px-6 py-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
                                            <ArrowLeft size={20} />
                                        </button>

                                        <div className="flex items-center gap-4">
                                            <div className="relative group cursor-default">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] p-[2px] shadow-md group-hover:shadow-lg transition-all duration-500">
                                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                                        {selectedChat.teacher_profile_image ? (
                                                            <img
                                                                src={selectedChat.teacher_profile_image}
                                                                alt={`${selectedChat.teacher_first_name} ${selectedChat.teacher_last_name}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b]">
                                                                {selectedChat.teacher_first_name?.[0]}{selectedChat.teacher_last_name?.[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                                                        {selectedChat.teacher_first_name} {selectedChat.teacher_last_name}
                                                    </h3>
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-100">TEACHER</span>
                                                </div>
                                                <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <span>chatting with</span>
                                                    <span className="font-semibold text-slate-700">
                                                        {selectedChat.student_first_name} {selectedChat.student_last_name}
                                                    </span>
                                                    <span className="px-1 py-0 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">STUDENT</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action/Menu Button */}
                                    <div className="relative group">
                                        <button
                                            onClick={handleDeleteClick}
                                            className="p-2 bg-white text-red-600 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                            Delete Conversation
                                        </div>
                                    </div>
                                </div>

                                {/* Details Bar - Hidden on small mobile to save space, or collapsible */}
                                <div className="px-6 py-3 hidden md:block border-t border-slate-100">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        <DetailItem icon={GraduationCap} label="Grade" value={selectedChat.grade_name} />
                                        <DetailItem icon={Heart} label="Guardian" value={selectedChat.guardian_name} />
                                        <DetailItem icon={Shield} label="Relation" value={selectedChat.guardian_relation} />
                                        <DetailItem icon={Languages} label="Language" value={selectedChat.preferred_language || 'English'} />
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 scroll-smooth custom-scrollbar"
                                ref={chatContainerRef}
                                onScroll={handleScroll}
                            >
                                {loadingMessages && hasMore && (
                                    <div className="py-2 flex justify-center"><div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-primary-500"></div></div>
                                )}

                                {messages.length === 0 && !loadingMessages ? (
                                    <div className="flex-1 flex flex-col items-center justify-center opacity-0 animate-fade-in fill-mode-forwards" style={{ animationDelay: '0.2s' }}>
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                            <MessageCircle size={24} className="text-slate-300" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">No messages in this conversation yet.</span>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        // "ME" checks: In admin view, "ME" is the admin user.
                                        // The messages are between Student and Teacher. 
                                        // Unless Admin IS the teacher, Admin is an observer.
                                        // Observer view:
                                        // Left: Teacher? Right: Student?
                                        // Or Left: Others, Right: Me (if I participated).
                                        // If Admin didn't send it, both should be on Left? Or alternating sides based on sender?

                                        // Implementation decision:
                                        // Designate "Teacher" messages to right side? "Student" to left?
                                        // Or keep traditional: You (Admin) on right, Everyone else on Left.
                                        // But if Admin never chatted, everyone is on Left. That looks weird.

                                        // BETTER UX: 
                                        // Student (Left - standard)
                                        // Teacher (Right - distinct color?)

                                        // Check Sender Role if available in msg object.
                                        // Assuming msg has `sender_id`.

                                        const isStudent = String(msg.sender_id) === String(selectedChat.student_id);
                                        const isTeacher = String(msg.sender_id) === String(selectedChat.teacher_id);
                                        const isAdmin = String(msg.sender_id) === String(user.id);

                                        // Positioning:
                                        // If Admin sent it: Right (standard "Me")
                                        // If Teacher sent it: Right (purple/different color?) or Left?
                                        // Standard chat view usually puts "Other" on Left. 
                                        // If we are "God view", we might want Left/Right separation for S/T.

                                        // Let's try:
                                        // Student -> Left (White/Gray)
                                        // Teacher -> Right (Primary Color - like they are the 'owner' context)
                                        // Admin -> Right (Accent Color?)

                                        // Actually simplest is:
                                        // If I am Admin, and I didn't send it:
                                        // All messages on Left, with clearly visible User Names/Avatars.
                                        // BUT, a wall of left-aligned text is hard to read dialogue.

                                        // Let's align Teacher to Right, Student to Left for contrast.
                                        const alignRight = isTeacher || isAdmin;

                                        const showDate = index === 0 || new Date(msg.sent_at).toDateString() !== new Date(messages[index - 1].sent_at).toDateString();

                                        return (
                                            <React.Fragment key={msg.id || index}>
                                                {showDate && (
                                                    <div className="flex justify-center my-4">
                                                        <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-bold tracking-wide">
                                                            {new Date(msg.sent_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'} mb-1`}>
                                                    {/* Sender Label for clarity in Admin View */}
                                                    <span className={`text-[10px] font-bold mb-1 px-1 ${alignRight ? 'text-primary-600 mr-1' : 'text-slate-500 ml-1'}`}>
                                                        {isAdmin ? 'Admin' : (msg.sender_name || (isTeacher ? 'Teacher' : isStudent ? 'Student' : 'User'))}
                                                    </span>

                                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group
                                                        ${alignRight
                                                            ? (isAdmin ? 'bg-amber-50 border border-amber-100 text-amber-900 rounded-br-none'
                                                                : 'bg-primary-50 border border-primary-100 text-slate-800 rounded-br-none')
                                                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}
                                                    `}>
                                                        <div dangerouslySetInnerHTML={{ __html: msg.content }} className="prose prose-sm max-w-none" />
                                                        <div className={`text-[9px] mt-1.5 flex ${alignRight ? 'justify-end' : 'justify-start'} font-bold opacity-60`}>
                                                            {formatTime(msg.sent_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                )}


                            </div>

                            {/* Input Area - Admin Implementation */}
                            <div className="p-4 border-t border-slate-100 bg-white/80 backdrop-blur-md">
                                <RichTextEditor
                                    value={messageInput}
                                    onChange={(val) => {
                                        setMessageInput(val);
                                        handleTypingInput();
                                    }}
                                    onSend={handleSend}
                                    isSending={sending}
                                    placeholder="Type a message as Admin..."
                                />
                            </div>
                        </div>
                    ) : (
                        // Empty State
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary-100 rounded-full blur-2xl opacity-60"></div>
                                <div className="relative w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200 border border-white">
                                    <Shield size={40} className="text-primary-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Admin Chat Monitor</h3>
                            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Select a conversation to view message history or intervene in a chat session.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedChat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Conversation?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete the chat with <strong>{selectedChat.student_first_name} {selectedChat.student_last_name}</strong>?
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all"
                                >
                                    Yes, Delete Chat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
};

export default AdminChats;
