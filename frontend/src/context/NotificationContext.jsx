import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;

        try {
            const response = await api.get('/messages/conversations');
            if (response.success || response.data?.success) { // Handle varied API response structures
                const convs = response.data?.data || response.data || [];

                // Filter conversations with unread messages
                const unreadConvs = convs.filter(c => parseInt(c.unread_count) > 0);

                setNotifications(unreadConvs);
                setUnreadCount(unreadConvs.length);
            }
        } catch (error) {
            console.error('[NotificationContext] Error fetching notifications:', error);
        }
    };

    // Initial Fetch on Login
    useEffect(() => {
        fetchNotifications();
    }, [user]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket || !user) return;

        // 1. New Message: Re-fetch or Increment
        const handleNewMessage = (data) => {
            // Option A: Optimistic Update (Faster)
            setNotifications(prev => {
                const exists = prev.find(n => String(n.id) === String(data.conversation_id));
                if (exists) {
                    // Just update the existing notification item
                    return prev.map(n => String(n.id) === String(data.conversation_id)
                        ? {
                            ...n,
                            unread_count: parseInt(n.unread_count) + 1,
                            last_message: data.content,
                            last_message_translated: data.translated_content // Store translated real-time update
                        }
                        : n
                    );
                } else {
                    // New conversation notification! 
                    // We might not have all conversation data here from just the message payload.
                    // Safer to re-fetch to get full conversation object (names, avatars etc)
                    fetchNotifications();
                    return prev;
                }
            });

            // Fallback: Always fetch fresh state after short delay to ensure consistency
            setTimeout(fetchNotifications, 1000);
        };

        // 2. Conversation Read: Clear Notification
        const handleConversationRead = ({ conversation_id }) => {
            setNotifications(prev => {
                const updated = prev.filter(n => String(n.id) !== String(conversation_id));
                setUnreadCount(updated.length);
                return updated;
            });
        };

        socket.on('new_message', handleNewMessage);
        socket.on('conversation_read', handleConversationRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('conversation_read', handleConversationRead);
        };
    }, [socket, user]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
