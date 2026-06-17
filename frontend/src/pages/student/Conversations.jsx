import React, { useRef } from 'react';
import { MessageCircle, Search, User, Shield, GraduationCap, Languages, ArrowLeft } from 'lucide-react';
import RichTextEditor from '../../components/common/RichTextEditor';
import { sanitizeHtml } from '../../utils/sanitize';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useChat } from '../../hooks/useChat';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Conversations = () => {
  const { user } = useAuth();
  const { isEnglish, preferredLangCode, getSpeechLocale } = useLanguage();
  const { t } = useTranslation(); // Hook
  const chatContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const userScrolledAwayRef = useRef(false); // Track if user manually scrolled up

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
  } = useChat('student'); // Pass 'student' as userType

  // Local state for message input
  const [messageInput, setMessageInput] = React.useState('');

  const handleSend = async () => {
    if (!messageInput.trim()) return;

    // Determine input language for backend translation logic
    const backendInputLang = isEnglish ? 'English' : (selectedChat?.preferred_language || 'English');

    const success = await sendMessage(messageInput, backendInputLang);
    if (success) {
      setMessageInput('');
    }
  };

  // Reset scroll tracking when chat changes
  React.useEffect(() => {
    prevScrollHeightRef.current = 0;
    userScrolledAwayRef.current = false; // Reset scroll-away flag
  }, [selectedChat?.id]);

  // Scroll handling with user intent tracking
  React.useLayoutEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const container = chatContainerRef.current;
      const isAtBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 50;
      const isFirstLoad = prevScrollHeightRef.current === 0;

      // Check if the last message is from the current user
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage && lastMessage.sender_id === user.id;

      if (isFirstLoad) {
        // First load: instant scroll to bottom
        container.style.scrollBehavior = 'auto';
        container.scrollTop = container.scrollHeight;
        prevScrollHeightRef.current = container.scrollHeight;
        userScrolledAwayRef.current = false;
        setTimeout(() => {
          container.style.scrollBehavior = 'smooth';
        }, 0);
      } else if (isOwnMessage || (!userScrolledAwayRef.current && isAtBottom) || (isAtBottom)) {
        // Auto-scroll if: user sent message OR user is at bottom (within 50px)
        container.style.scrollBehavior = 'auto';
        container.scrollTop = container.scrollHeight;
        prevScrollHeightRef.current = container.scrollHeight;
        userScrolledAwayRef.current = false; // Reset flag when auto-scrolling
        setTimeout(() => {
          container.style.scrollBehavior = 'smooth';
        }, 0);
      } else {
        // User scrolled away or loading old messages: maintain position
        const oldScrollHeight = prevScrollHeightRef.current;
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeight;

        if (scrollDiff > 0 && container.scrollTop < 100) {
          // Loading older messages at top: adjust scroll to maintain position
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

  // Resize Observer to handle keyboard opening/closing or window resizing
  React.useEffect(() => {
    if (!chatContainerRef.current) return;

    const container = chatContainerRef.current;
    const resizeObserver = new ResizeObserver(() => {
      // Keep user at bottom if they were at bottom (or if it's their own latest message)
      if (!userScrolledAwayRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedChat?.id]);

  // Auto-scroll when typing indicator appears
  React.useEffect(() => {
    if (otherUserTyping && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 150;

      // Only auto-scroll to show typing if user is near the bottom
      if (isNearBottom || !userScrolledAwayRef.current) {
        container.style.scrollBehavior = 'smooth';
        container.scrollTop = container.scrollHeight;
        userScrolledAwayRef.current = false;
      }
    }
  }, [otherUserTyping]);

  // Track user scroll intent
  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 50;

    // Update flag: user scrolled away if not at bottom
    userScrolledAwayRef.current = !isAtBottom;

    // Trigger infinite scroll for old messages
    if (container.scrollTop === 0 && hasMore && !loadingMessages) {
      loadMore();
    }
  };

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
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-slate-900 truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );

  if (loadingConversations && conversations.length === 0) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
          <p className="text-slate-400 text-sm font-medium">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-80px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in font-inter">

      {/* Sidebar List */}
      <div className={`
                ${selectedChat ? 'hidden md:flex' : 'flex'} 
                w-full md:w-80 border-r border-slate-100 flex-col bg-white
            `}>
        <div className="p-5 border-b border-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight px-1">{t('conversations:myTeachers')}</h2>
          <div className="relative group">
            <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder={t('conversations:searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50/50 outline-none transition-all placeholder-slate-500 text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 space-y-0 custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={20} className="text-slate-300" />
              </div>
              <p className="text-slate-900 font-medium text-sm">{t('conversations:noConversations')}</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const teacherName = conv.teacher_first_name ?
                `${conv.teacher_first_name} ${conv.teacher_last_name}` : t('conversations:unknownTeacher');
              const initials = conv.teacher_first_name ?
                `${conv.teacher_first_name[0]}${conv.teacher_last_name?.[0] || ''}` : '?';

              const unreadCount = parseInt(conv.unread_count || 0);

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedChat(conv)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 flex gap-3 group relative overflow-hidden
                                    ${selectedChat?.id === conv.id
                      ? 'bg-primary-50/60'
                      : 'hover:bg-slate-50'}`}
                >
                  {selectedChat?.id === conv.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary-500 rounded-r-full"></div>
                  )}

                  {conv.teacher_profile_image ? (
                    <img
                      src={conv.teacher_profile_image}
                      alt={teacherName}
                      className={`w-12 h-12 rounded-full object-cover shrink-0 shadow-sm transition-all group-hover:scale-105 ${selectedChat?.id === conv.id
                        ? 'ring-2 ring-primary-100 border-2 border-primary-600'
                        : 'border border-slate-100 group-hover:border-primary-200'
                        }`}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm transition-all group-hover:scale-105 relative
                        ${selectedChat?.id === conv.id
                        ? 'bg-primary-600 text-white ring-2 ring-primary-100'
                        : 'bg-white text-slate-500 border border-slate-100 group-hover:border-primary-200 group-hover:bg-white'}`}>
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className={`font-bold text-sm truncate transition-colors ${selectedChat?.id === conv.id ? 'text-primary-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                          {teacherName}
                        </span>

                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap px-1.5 py-0.5 rounded-full ${unreadCount > 0 ? 'text-green-600 bg-green-50 font-bold' : 'text-slate-400 bg-white/50'}`}>
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs truncate leading-relaxed flex-1 ${selectedChat?.id === conv.id ? 'text-primary-700/80 font-medium' : unreadCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-400 group-hover:text-slate-500'}`}>
                        {(() => {
                          const showNative = !isEnglish;
                          const previewText = showNative
                            ? (conv.last_message_translated || conv.last_message)
                            : conv.last_message;
                          return stripHtml(previewText) || t('conversations:noMessages');
                        })()}
                      </p>
                      {unreadCount > 0 && (
                        <span className="shrink-0 bg-green-500 text-white text-xs font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-sm animate-fade-in">
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
      <div className={`
                ${selectedChat ? 'flex' : 'hidden md:flex'} 
                flex-1 flex-col bg-slate-50/50 relative
            `}>
        {selectedChat ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 sticky top-0">
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="flex items-center gap-4">
                    {/* Language Toggle removed - using global header toggle */}

                    <div className="relative group cursor-default">
                      <div className="w-12 h-12 rounded-full bg-primary-600 p-[2px] shadow-md group-hover:shadow-lg transition-all duration-500">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                          {selectedChat.teacher_profile_image ? (
                            <img
                              src={selectedChat.teacher_profile_image}
                              alt={`${selectedChat.teacher_first_name} ${selectedChat.teacher_last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base font-bold text-primary-700">
                              {selectedChat.teacher_first_name?.[0]}{selectedChat.teacher_last_name?.[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
                        {selectedChat.teacher_first_name} {selectedChat.teacher_last_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 font-medium">
                          Email: <span className="font-mono text-slate-400">{selectedChat.teacher_email || 'N/A'}</span>
                        </span>
                        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm
                                                ${selectedChat.teacher_is_online
                            ? 'bg-green-50 text-green-700 border-green-200/60'
                            : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${selectedChat.teacher_is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {selectedChat.teacher_is_online ? t('common:online') : t('common:offline')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 scroll-smooth custom-scrollbar"
              ref={chatContainerRef}
              onScroll={handleScroll}
            >
              {loadingMessages && hasMore && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-primary-500"></div>
                </div>
              )}

              {messages.length === 0 && !loadingMessages ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-0 animate-fade-in fill-mode-forwards" style={{ animationDelay: '0.2s' }}>
                  <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-3 shadow-sm">
                    <MessageCircle size={24} className="text-primary-300" />
                  </div>
                  <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-xs font-medium text-slate-400 shadow-sm">
                    {t('conversations:emptyState.startPrompt')}
                  </span>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isMe = msg.sender_id === user.id;
                    const isAdmin = msg.role === 'admin';
                    const showDate = index === 0 || new Date(msg.sent_at).toDateString() !== new Date(messages[index - 1].sent_at).toDateString();

                    return (
                      <React.Fragment key={msg.id || index}>
                        {showDate && (
                          <div className="flex justify-center my-2">
                            <span className="text-xs bg-slate-100/80 px-2 py-0.5 rounded-full text-slate-500 font-medium">
                              {new Date(msg.sent_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
                        >
                          <div
                            className={`
                                                            max-w-[85%] px-3.5 py-2 rounded-xl text-sm shadow-sm relative group transition-all
                                                            ${isMe
                                ? 'bg-primary-50 text-slate-900 border border-primary-100 rounded-br-none'
                                : isAdmin
                                  ? 'bg-amber-50 text-amber-900 border border-amber-100 rounded-bl-none'
                                  : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}
                                                        `}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: (() => {
                                  const showNative = !isEnglish;

                                  // Unified Display Logic (Normalized DB: content=English, translated_content=Native)
                                  const raw = showNative
                                    ? (msg.translated_content || msg.content) // Show Native (fallback to English)
                                    : msg.content;                            // Show English
                                  return sanitizeHtml(raw);
                                })()
                              }}
                              className={`prose prose-sm max-w-none leading-snug ${isMe ? 'text-slate-900' : isAdmin ? 'text-amber-900' : 'text-slate-800'}`}
                            />

                            <div className={`text-xs mt-1 flex justify-end font-medium select-none ${isAdmin ? 'text-amber-700/60' : 'text-slate-500'}`}>
                              {formatTime(msg.sent_at)}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}


                  {/* Typing Indicator - In list */}
                  {otherUserTyping && (
                    <div className="flex items-start animate-in fade-in slide-in-from-bottom-1 duration-200 mb-2">
                      <div className="bg-white border border-slate-100 px-3.5 py-2.5 rounded-xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-xs font-medium text-slate-500 ml-1">{t('conversations:typing')}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm shrink-0">
              <RichTextEditor
                value={messageInput}
                onChange={(val) => {
                  setMessageInput(val);
                  handleTypingInput();
                }}
                onSend={handleSend}
                isSending={sending}
                placeholder={t('conversations:typePlaceholder', { language: isEnglish ? 'English' : (selectedChat?.preferred_language || 'Native') })}
                lang={isEnglish ? 'en-US' : (getSpeechLocale ? getSpeechLocale(preferredLangCode) : preferredLangCode)}
              />
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
            <div className="relative mb-6">
              <div className="relative w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200">
                <MessageCircle size={48} className="text-primary-500 opacity-80" strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">{t('conversations:emptyState.title')}</h3>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
              {t('conversations:emptyState.desc')}
            </p>
            <button
              onClick={refreshConversations}
              className="mt-6 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 hover:text-primary-600 transition-colors shadow-sm"
            >
              {t('conversations:refreshList')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
