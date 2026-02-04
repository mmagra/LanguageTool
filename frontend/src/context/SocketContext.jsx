import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, loading } = useAuth();

    // Connect to socket when user is logged in
    useEffect(() => {
        if (!loading && user) {
            // Replace with your actual backend URL from env or constant
            // Using || '' avoids accessing localhost by default, which triggers browser warnings
            const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
            if (!BACKEND_URL) {
                console.error('VITE_API_BASE_URL is not defined');
                return;
            }
            const socketUrl = BACKEND_URL.replace('/api', '');

            const newSocket = io(socketUrl, {
                query: { userId: user.id },
                reconnection: true,
                transports: ['websocket', 'polling']
            });

            console.log('🔌 Connecting to socket...', socketUrl, 'User:', user.id);

            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('✅ Socket connected:', newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('❌ Socket connection error:', err);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('❌ Socket disconnected:', reason);
            });

            return () => {
                console.log('🔌 Disconnecting socket...');
                newSocket.close();
                setSocket(null);
            };
        } else if (!user && socket) {
            // Close socket if user logs out
            socket.close();
            setSocket(null);
        }
    }, [user, loading]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
