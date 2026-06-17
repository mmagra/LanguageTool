const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { pool } = require('../config/database');
const config = require('../config/config');

let io;

const onlineUsers = new Map(); // userId -> Set<socketId>

const init = (server) => {
    const allowedOrigins = [config.frontendUrl, config.corsOrigin].filter(Boolean);
    io = socketIo(server, {
        cors: {
            origin: allowedOrigins.length ? allowedOrigins : false,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authenticate every socket via JWT — never trust a client-supplied userId.
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token
                || socket.handshake.query?.token
                || (socket.handshake.headers?.authorization || '').replace('Bearer ', '');
            if (!token) return next(new Error('Authentication required'));
            const decoded = jwt.verify(token, config.jwt.secret);
            socket.userId = String(decoded.id);
            socket.userRole = decoded.role;
            socket.schoolId = decoded.school_id;
            next();
        } catch (err) {
            next(new Error('Invalid authentication token'));
        }
    });

    const endSessionInDb = async (sessionId, room) => {
        try {
            // End the session in DB
            const result = await pool.query(
                `UPDATE sessions 
                 SET status = 'completed', end_time = NOW(), 
                 duration_minutes = CEIL(EXTRACT(EPOCH FROM (NOW() - start_time))/60)
                 WHERE id = $1 AND status = 'active'
                 RETURNING *`,
                [sessionId]
            );

            if (result.rows.length > 0) {
                const session = result.rows[0];
                const duration = session.duration_minutes || 0;

                // Update School Quota
                await pool.query(
                    `UPDATE schools SET minutes_used = minutes_used + $1 WHERE id = $2`,
                    [duration, session.school_id]
                );


                // Notify remaining users
                io.to(room).emit('session_ended', { sessionId, duration });
            }
        } catch (err) {
            console.error(`Error ending session ${sessionId}:`, err);
        }
    };

    io.on('connection', (socket) => {

        // Identity comes from the verified JWT (set in io.use), not from the client query.
        const userId = socket.userId;
        if (userId) {
            // Join personal user room for direct messaging
            socket.join(String(userId));

            // Add user to online tracking
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId).add(socket.id);

            // Update database status to online
            User.setOnlineStatus(userId, true)
                .then(() => {
                })
                .catch(err => {
                    console.error(`Error setting user ${userId} online:`, err);
                });

            // Broadcast online status
            io.emit('user_online', { userId });
        }

        socket.on('join_conversation', (conversationId) => {
            // Ensure ID is string for consistency
            const room = String(conversationId);
            socket.join(room);
        });

        socket.on('leave_conversation', (conversationId) => {
            const room = String(conversationId);
            socket.leave(room);
        });

        // Allow clients to check status of a specific user
        socket.on('check_status', (targetId) => {
            const isOnline = onlineUsers.has(String(targetId));
            socket.emit('user_status', { userId: targetId, isOnline });
        });

        // Typing Indicators
        socket.on('typing_start', (conversationId) => {
            // Broadcast to everyone in the conversation room EXCEPT the sender
            socket.to(String(conversationId)).emit('typing_start', {
                conversation_id: conversationId,
                user_id: userId // The person who is typing
            });
        });

        socket.on('typing_stop', (conversationId) => {
            socket.to(String(conversationId)).emit('typing_stop', {
                conversation_id: conversationId,
                user_id: userId
            });
        });

        // Profile Update Event
        socket.on('profile_updated', (data) => {
            // Broadcast to all users that this user's profile was updated
            io.emit('user_profile_updated', {
                userId: data.userId || userId,
                profileImage: data.profileImage
            });
        });



        // --- REAL-TIME LIVE CONVERSATION EVENTS --- //

        socket.on('join_session', (roomId) => {
            const room = String(roomId);
            socket.join(room);
        });

        // Teacher sends invite to student
        socket.on('session_invite', ({ studentId, teacherName, teacherImage, roomId }) => {
            const room = String(roomId);

            // Send to student's personal room
            io.to(String(studentId)).emit('session_invite', {
                teacherName,
                teacherImage,
                roomId
            });

            // IMPORTANT: Make the student's socket(s) join the session room
            // so they can receive session_cancelled if teacher cancels before they accept
            const studentSockets = io.sockets.adapter.rooms.get(String(studentId));
            if (studentSockets) {
                studentSockets.forEach(socketId => {
                    const studentSocket = io.sockets.sockets.get(socketId);
                    if (studentSocket) {
                        studentSocket.join(room);
                    }
                });
            }
        });

        // Student accepts invite
        socket.on('session_accepted', ({ roomId }) => {
            const room = String(roomId);
            socket.join(room); // Ensure student is in room
            // Notify teacher (and anyone else in room)
            io.to(room).emit('session_accepted', { roomId });
        });

        // Teacher cancels session request
        socket.on('session_cancelled', (roomId) => {
            const room = String(roomId);
            // Broadcast to everyone in room (mainly the student)
            io.to(room).emit('session_cancelled', { roomId });
        });

        // Student declines session invitation
        socket.on('session_declined', ({ roomId }) => {
            const room = String(roomId);
            // Broadcast to everyone in room (mainly the teacher)
            io.to(room).emit('session_declined', { roomId });
        });

        // Speech/Text Exchange
        socket.on('session_speech', (data) => {
            // data = { roomId, original, translated, ... }
            const room = String(data.roomId);
            // Broadcast to everyone in room EXCEPT sender
            socket.to(room).emit('session_speech', data);
        });

        // Presence Check (Heartbeat/Handshake)
        socket.on('session_check_presence', ({ roomId }) => {
            const room = String(roomId);
            socket.to(room).emit('session_check_presence', { roomId });
        });

        socket.on('session_presence_ack', ({ roomId }) => {
            const room = String(roomId);
            socket.to(room).emit('session_presence_ack', { roomId });
        });

        // End Session
        socket.on('end_session', async (roomId) => {
            const room = String(roomId);
            // Parse ID if needed
            const parts = room.split('_');
            let sessionId = (parts.length === 2 && !isNaN(parts[1])) ? parts[1] : null;

            if (parts.length === 3) {
                // session_Teacher_Student - Need to look up ID or just use TeacherID logic?
                // Reuse logic from disconnecting?
                // For now, assume if explicit end_session is called, we want to run DB logic.
                // But typically End Button calls API.
                // This event is usually from Student leaving or legacy.
                // Let's safe-guard:
                const teacherId = parts[1];
                // Lookup active session
                const res = await pool.query(`SELECT id FROM sessions WHERE teacher_id = $1 AND status = 'active'`, [teacherId]);
                if (res.rows.length > 0) sessionId = res.rows[0].id;
            }

            if (sessionId) {
                await endSessionInDb(sessionId, room);
            } else {
                // Just emit if no DB session found (legacy or already ended)
                io.to(room).emit('session_ended');
            }

            // Clean up: make this socket leave
            socket.leave(room);
        });

        // Leave Session (cleanup)
        socket.on('leave_session', async ({ roomId }) => {
            const room = String(roomId);

            // Same logic as end_session, if someone leaves, we end it? 
            // Or just let them leave? User requirement: "automatically end".
            const parts = room.split('_');
            let sessionId = (parts.length === 2 && !isNaN(parts[1])) ? parts[1] : null;

            if (parts.length === 3) {
                const teacherId = parts[1];
                const res = await pool.query(`SELECT id FROM sessions WHERE teacher_id = $1 AND status = 'active'`, [teacherId]);
                if (res.rows.length > 0) sessionId = res.rows[0].id;
            }

            if (sessionId) {
                await endSessionInDb(sessionId, room);
            }

            socket.leave(room);
        });

        socket.on('disconnecting', async () => {
            const rooms = [...socket.rooms];
            // for...of with await — forEach(async) does not wait, which could leave
            // a session 'active' in the DB if the process is interrupted mid-cleanup.
            for (const room of rooms) {
                if (room.startsWith('session_')) {
                    const parts = room.split('_');
                    let sessionId = null;

                    if (parts.length === 3) {
                        const teacherId = parts[1];
                        const res = await pool.query(`SELECT id FROM sessions WHERE teacher_id = $1 AND status = 'active'`, [teacherId]);
                        if (res.rows.length > 0) sessionId = res.rows[0].id;
                    } else if (parts.length === 2 && !isNaN(parts[1])) {
                        sessionId = parseInt(parts[1]);
                    }

                    if (sessionId) {
                        await endSessionInDb(sessionId, room);
                    }
                }
            }
        });

        socket.on('disconnect', () => {
            if (userId && onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);
                userSockets.delete(socket.id);

                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);

                    // Update database status to offline
                    User.setOnlineStatus(userId, false)
                        .then(() => {
                        })
                        .catch(err => {
                            console.error(`Error setting user ${userId} offline:`, err);
                        });

                    io.emit('user_offline', { userId });
                }
            }
        });
    });

    return io;
};

const isUserOnline = (userId) => {
    return onlineUsers.has(String(userId));
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = {
    init,
    getIO,
    isUserOnline
};
