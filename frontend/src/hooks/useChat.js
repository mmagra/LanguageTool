import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useChat = (userType = 'teacher') => { // 'teacher' or 'student'
    const { user } = useAuth();
    const { socket } = useSocket();
    const [searchParams] = useSearchParams();

    // Data State
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    // UI State
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTyping, setIsTyping] = useState(false); // Am I typing?
    const [otherUserTyping, setOtherUserTyping] = useState(false); // Is the other person typing?

    // Pagination
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 50;

    // Refs
    const typingTimeoutRef = useRef(null);

    // 1. Initial Load & URL handling
    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        const chatId = searchParams.get('id');
        if (chatId && conversations.length > 0 && !selectedChat) {
            const targetChat = conversations.find(c => c.id === parseInt(chatId));
            if (targetChat) {
                setSelectedChat(targetChat);
            }
        }
    }, [conversations, searchParams, selectedChat]);

    // 2. Fetch Messages when chat selected
    useEffect(() => {
        if (selectedChat) {
            setMessages([]);
            setOffset(0);
            setHasMore(true);
            setOtherUserTyping(false); // Reset typing status
            fetchMessages(selectedChat.id, 0, true);
        }
    }, [selectedChat]);

    // 3. Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        if (selectedChat) {
            socket.emit('join_conversation', selectedChat.id);
        }

        const handleNewMessage = (newMessage) => {
            // 1. Update Messages Area
            const isMatch = selectedChat && String(newMessage.conversation_id) === String(selectedChat.id);
            if (isMatch) {
                setMessages((prev) => {
                    if (prev.some(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
                setOtherUserTyping(false); // Message received, stop typing indicator

                // Mark as read immediately since we are viewing it
                api.put(`/messages/conversations/${selectedChat.id}/read`).catch(err =>
                    console.error('Error marking new message as read:', err)
                );
            }

            // 2. Update Conversations List
            setConversations(prev => {
                const updated = prev.map(c => {
                    if (String(c.id) === String(newMessage.conversation_id)) {
                        const isSelected = selectedChat && String(selectedChat.id) === String(c.id);
                        // Server now handles unread count increment logic in DB hooks, 
                        // but we do optimistic update here for UI speed
                        // If selected, we keep it 0 (and we just fired the API call above to sync DB)
                        const newUnreadCount = isSelected ? 0 : (parseInt(c.unread_count || 0) + 1);

                        return {
                            ...c,
                            last_message: newMessage.content,
                            updated_at: new Date(newMessage.sent_at).toISOString(),
                            unread_count: newUnreadCount
                        };
                    }
                    return c;
                });

                // Move active chat to top
                const chatIndex = updated.findIndex(c => String(c.id) === String(newMessage.conversation_id));
                if (chatIndex > 0) {
                    const [chat] = updated.splice(chatIndex, 1);
                    updated.unshift(chat);
                }
                return updated;
            });
        };

        const handleUserOnline = ({ userId }) => {
            setConversations(prev => prev.map(c => {
                let isMatch = false;
                if (userType === 'admin') {
                    isMatch = String(c.student_id) === String(userId) || String(c.teacher_id) === String(userId);
                } else {
                    const targetId = userType === 'teacher' ? c.student_id : c.teacher_id;
                    isMatch = String(targetId) === String(userId);
                }

                if (!isMatch) return c;

                // For admin, we might want to know WHO is online, but for now we'll just update the respective flag
                if (String(c.student_id) === String(userId)) return { ...c, student_is_online: true };
                if (String(c.teacher_id) === String(userId)) return { ...c, teacher_is_online: true };
                return c;
            }));

            if (selectedChat) {
                let isMatch = false;
                if (userType === 'admin') {
                    isMatch = String(selectedChat.student_id) === String(userId) || String(selectedChat.teacher_id) === String(userId);
                } else {
                    const targetId = userType === 'teacher' ? selectedChat.student_id : selectedChat.teacher_id;
                    isMatch = String(targetId) === String(userId);
                }

                if (isMatch) {
                    setSelectedChat(prev => {
                        if (String(prev.student_id) === String(userId)) return { ...prev, student_is_online: true };
                        if (String(prev.teacher_id) === String(userId)) return { ...prev, teacher_is_online: true };
                        return prev;
                    });
                }
            }
        };

        const handleUserOffline = ({ userId }) => {
            setConversations(prev => prev.map(c => {
                let isMatch = false;
                if (userType === 'admin') {
                    isMatch = String(c.student_id) === String(userId) || String(c.teacher_id) === String(userId);
                } else {
                    const targetId = userType === 'teacher' ? c.student_id : c.teacher_id;
                    isMatch = String(targetId) === String(userId);
                }

                if (!isMatch) return c;

                if (String(c.student_id) === String(userId)) return { ...c, student_is_online: false };
                if (String(c.teacher_id) === String(userId)) return { ...c, teacher_is_online: false };
                return c;
            }));

            if (selectedChat) {
                let isMatch = false;
                if (userType === 'admin') {
                    isMatch = String(selectedChat.student_id) === String(userId) || String(selectedChat.teacher_id) === String(userId);
                } else {
                    const targetId = userType === 'teacher' ? selectedChat.student_id : selectedChat.teacher_id;
                    isMatch = String(targetId) === String(userId);
                }

                if (isMatch) {
                    setSelectedChat(prev => {
                        if (String(prev.student_id) === String(userId)) return { ...prev, student_is_online: false };
                        if (String(prev.teacher_id) === String(userId)) return { ...prev, teacher_is_online: false };
                        return prev;
                    });
                }
            }
        };

        // Typing Handlers
        const handleTypingStart = ({ conversation_id }) => {
            if (selectedChat && String(conversation_id) === String(selectedChat.id)) {
                setOtherUserTyping(true);
            }
        };

        const handleTypingStop = ({ conversation_id }) => {
            if (selectedChat && String(conversation_id) === String(selectedChat.id)) {
                setOtherUserTyping(false);
            }
        };

        // Profile Update Handler - refresh conversations when profile images change
        const handleProfileUpdated = ({ userId }) => {
            // Refresh conversations to get updated profile images
            fetchConversations();

            // Also update selectedChat if it matches
            if (selectedChat) {
                let isMatch = false;
                if (userType === 'admin') {
                    isMatch = String(selectedChat.student_id) === String(userId) || String(selectedChat.teacher_id) === String(userId);
                } else {
                    const targetId = userType === 'teacher' ? selectedChat.student_id : selectedChat.teacher_id;
                    isMatch = String(targetId) === String(userId);
                }

                if (isMatch) {
                    // Re-fetch to get updated data
                    fetchConversations();
                }
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_online', handleUserOnline);
        socket.on('user_offline', handleUserOffline);
        socket.on('typing_start', handleTypingStart);
        socket.on('typing_stop', handleTypingStop);
        socket.on('user_profile_updated', handleProfileUpdated);

        return () => {
            if (selectedChat) {
                socket.emit('leave_conversation', selectedChat.id);
            }
            socket.off('new_message', handleNewMessage);
            socket.off('user_online', handleUserOnline);
            socket.off('user_offline', handleUserOffline);
            socket.off('typing_start', handleTypingStart);
            socket.off('typing_stop', handleTypingStop);
            socket.off('user_profile_updated', handleProfileUpdated);
        };
    }, [socket, selectedChat, userType]);

    // 4. Mark Read Logic
    useEffect(() => {
        if (selectedChat && parseInt(selectedChat.unread_count || 0) > 0) {
            const markRead = async () => {
                try {
                    await api.put(`/messages/conversations/${selectedChat.id}/read`);

                    setConversations(prev => prev.map(c =>
                        c.id === selectedChat.id ? { ...c, unread_count: 0 } : c
                    ));
                    setSelectedChat(prev => ({ ...prev, unread_count: 0 }));
                } catch (error) {
                    console.error('Error marking chat as read:', error);
                }
            };
            markRead();
        }
    }, [selectedChat]);

    // API Methods
    const fetchConversations = async () => {
        try {
            setLoadingConversations(true);
            const response = await api.get('/messages/conversations');
            if (response.success) {
                setConversations(Array.isArray(response.data) ? response.data : (response.data?.data || []));
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoadingConversations(false);
        }
    };

    const fetchMessages = async (chatId, currentOffset = 0, isInitial = false) => {
        try {
            setLoadingMessages(true);
            const response = await api.get(`/messages/conversations/${chatId}?limit=${LIMIT}&offset=${currentOffset}`);
            if (response.success) {
                const newMessages = response.data.messages || [];
                if (isInitial) setMessages(newMessages);
                else setMessages(prev => [...newMessages, ...prev]);

                if (newMessages.length < LIMIT) setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    const sendMessage = async (content, inputLanguage = 'en-US') => {
        if (!content.trim() || !selectedChat) return;

        try {
            setSending(true);

            // Stop typing immediately when sending
            if (socket) socket.emit('typing_stop', selectedChat.id);
            setIsTyping(false);

            const response = await api.post(`/messages/conversations/${selectedChat.id}/messages`, {
                content,
                inputLanguage
            });

            if (response.success) {
                const sentMessage = response.data?.data || response.data;
                const messageToAdd = {
                    ...sentMessage,
                    id: sentMessage.id, // Ensure ID is included
                    sender_id: user.id,
                    sender_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    sent_at: sentMessage.sent_at || new Date().toISOString()
                };

                setMessages(prev => {
                    // Check if message already exists (prevent duplicate)
                    if (prev.some(m => m.id === messageToAdd.id)) return prev;
                    return [...prev, messageToAdd];
                });

                // Update sidebar
                setConversations(prev => {
                    const updated = [...prev];
                    const index = updated.findIndex(c => c.id === selectedChat.id);
                    if (index > -1) {
                        const [chat] = updated.splice(index, 1);
                        chat.last_message = content;
                        chat.updated_at = new Date().toISOString();
                        updated.unshift(chat);
                    }
                    return updated;
                });

                return true;
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
            return false;
        } finally {
            setSending(false);
        }
    };

    const handleTypingInput = (e) => {
        if (!selectedChat || !socket) return;

        // logic to emit typing_start / stop with debounce
        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing_start', selectedChat.id);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('typing_stop', selectedChat.id);
        }, 2000); // Stop typing after 2 seconds of inactivity
    };

    const loadMore = () => {
        if (!hasMore || loadingMessages) return;
        const newOffset = offset + LIMIT;
        setOffset(newOffset);
        fetchMessages(selectedChat.id, newOffset, false);
    };

    const refreshConversations = fetchConversations;

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        let targetName = '';
        if (userType === 'admin') {
            targetName = `${conv.student_first_name} ${conv.student_last_name} ${conv.teacher_first_name} ${conv.teacher_last_name}`;
        } else {
            targetName = userType === 'teacher'
                ? `${conv.student_first_name} ${conv.student_last_name}`
                : `${conv.teacher_first_name} ${conv.teacher_last_name}`;
        }
        return targetName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return {
        conversations: filteredConversations,
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
    };
};
