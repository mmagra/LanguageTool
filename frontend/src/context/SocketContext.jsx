import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, loading } = useAuth();

    // Connect to socket when user is logged in
    useEffect(() => {
        if (!loading && user) {
            const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
            if (!BACKEND_URL) {
                console.error('VITE_API_BASE_URL is not defined');
                return;
            }
            const socketUrl = BACKEND_URL.replace('/api', '');

            // Authenticate the socket with the JWT — the server derives identity from it.
            const token = localStorage.getItem('token');

            const newSocket = io(socketUrl, {
                auth: { token },
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                transports: ['websocket', 'polling']
            });

            setSocket(newSocket);

            newSocket.on('connect', () => {
                // Fires on first connect and on every successful reconnect.
                // The backend re-registers the user (same query userId) on each new connection.
                setIsConnected(true);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                setIsConnected(false);
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
            });

            return () => {
                newSocket.close();
                setSocket(null);
                setIsConnected(false);
            };
        } else if (!user && socket) {
            // Close socket if user logs out
            socket.close();
            setSocket(null);
            setIsConnected(false);
        }
    }, [user, loading]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
