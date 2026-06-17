const Conversation = require('../models/Conversation');
const User = require('../models/User');
const db = require('../config/database');
const socketManager = require('../socket/socketManager');
const { isUserOnline } = require('../socket/socketManager');
const { performTranslation } = require('./translationController');
const { logAction } = require('./auditController');

// Build a human-readable sender name, never "undefined undefined".
const displayName = (u) =>
    [u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(' ').trim()
    || u.email || 'Unknown User';

// True when a non-super-admin user may act across the given school_id.
const sameSchool = (reqUser, schoolId) =>
    reqUser.role === 'super admin' || (reqUser.school_id && reqUser.school_id === schoolId);

// @desc    Get user's conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        let conversations;

        if (req.user.role === 'admin') {
            conversations = await Conversation.getAll(req.user.school_id);
        } else {
            conversations = await Conversation.getByUserId(userId);
        }

        // Inject real-time online status
        conversations = conversations.map(c => ({
            ...c,
            teacher_is_online: isUserOnline(c.teacher_id),
            student_is_online: isUserOnline(c.student_id)
        }));

        res.json({
            success: true,
            count: conversations.length,
            data: conversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching conversations'
        });
    }
};

// @desc    Get conversation by ID with messages
// @route   GET /api/messages/conversations/:id
// @access  Private
exports.getConversationById = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Check if user is part of conversation
        // Check if user is part of conversation
        // Check if user is part of conversation
        const userId = parseInt(req.user.id, 10);
        if (conversation.student_id !== userId && conversation.teacher_id !== userId) {
            if (req.user.role === 'admin') {
                // Check if admin belongs to the same school as the student in the conversation
                if (req.user.school_id && conversation.student_school_id !== req.user.school_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Not authorized to view this conversation (School Mismatch)'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this conversation'
                });
            }
        }

        // Inject real-time online status
        conversation.teacher_is_online = isUserOnline(conversation.teacher_id);
        conversation.student_is_online = isUserOnline(conversation.student_id);

        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const messages = await Conversation.getMessages(req.params.id, limit, offset);

        // Mark as read
        await Conversation.markAsRead(req.params.id, userId);

        res.json({
            success: true,
            data: {
                conversation,
                messages,
                pagination: {
                    limit,
                    offset,
                    count: messages.length
                }
            }
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching conversation'
        });
    }
};

// @desc    Create new conversation
// @route   POST /api/messages/conversations
// @access  Private
exports.createConversation = async (req, res) => {
    try {
        const { studentId, teacherId, subject } = req.body;

        if (!studentId || !teacherId || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Student ID, Teacher ID, and subject are required'
            });
        }

        // Verify both participants exist and have the expected roles
        const [student, teacher] = await Promise.all([
            User.findById(studentId),
            User.findById(teacherId)
        ]);
        if (!student || student.role !== 'student' || !teacher || teacher.role !== 'teacher') {
            return res.status(404).json({ success: false, message: 'Invalid student or teacher' });
        }

        // Multi-tenant isolation: both participants must belong to the caller's school
        if (!sameSchool(req.user, student.school_id) || student.school_id !== teacher.school_id) {
            return res.status(403).json({ success: false, message: 'Not authorized to create this conversation' });
        }

        // Role gate: students/teachers may only create conversations they are part of
        const callerId = parseInt(req.user.id, 10);
        const isAdmin = req.user.role === 'admin' || req.user.role === 'super admin';
        if (!isAdmin && callerId !== parseInt(studentId, 10) && callerId !== parseInt(teacherId, 10)) {
            return res.status(403).json({ success: false, message: 'Not authorized to create this conversation' });
        }

        const conversation = await Conversation.create(studentId, teacherId, subject);

        res.status(201).json({
            success: true,
            message: 'Conversation created successfully',
            data: conversation
        });
    } catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating conversation'
        });
    }
};

// @desc    Send message in conversation
// @route   POST /api/messages/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { content, translatedContent } = req.body;
        const senderId = req.user.id;
        const senderName = displayName(req.user);

        if (content && content.length > 5000) {
            return res.status(400).json({ success: false, message: 'Message is too long (max 5000 characters)' });
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        // Check if conversation exists
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Check if user is part of conversation
        if (conversation.student_id !== senderId && conversation.teacher_id !== senderId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to send messages in this conversation'
            });
        }

        // Fetch the student's preferred language from their profile (not from conversation object)
        let preferredLanguage = null;
        try {
            const langResult = await db.query(
                `SELECT l.name as preferred_language
                 FROM student_profiles sp
                 LEFT JOIN languages l ON sp.preferred_language_id = l.id
                 WHERE sp.user_id = $1`,
                [conversation.student_id]
            );
            preferredLanguage = langResult.rows[0]?.preferred_language || null;
        } catch (langErr) {
            console.warn('Could not fetch student preferred language:', langErr.message);
        }

        let finalContent = content;
        let finalTranslatedContent = translatedContent;
        let translationFailed = false; // true if a translation was attempted but failed (e.g. quota)

        const schoolId = req.user.school_id;

        if (!finalTranslatedContent && req.user.role === 'student') {
            const targetLang = preferredLanguage;
            const inputLang = req.body.inputLanguage || 'English';

            if (targetLang && targetLang !== 'English') {
                try {
                    if (inputLang === 'English') {
                        finalTranslatedContent = await performTranslation(content, targetLang, schoolId);
                    } else {
                        finalContent = await performTranslation(content, 'English', schoolId);
                        finalTranslatedContent = content;
                    }
                } catch (err) {
                    // Quota reached or service down → send untranslated rather than blocking the message
                    console.warn('Auto-translation skipped:', err.message);
                    translationFailed = true;
                }
            }
        } else if (!finalTranslatedContent && (req.user.role === 'teacher' || req.user.role === 'admin')) {
            const targetLang = preferredLanguage;
            if (targetLang && targetLang !== 'English') {
                try {
                    finalTranslatedContent = await performTranslation(content, targetLang, schoolId);
                } catch (err) {
                    console.warn('Auto-translation skipped:', err.message);
                    translationFailed = true;
                }
            }
        }

        const message = await Conversation.addMessage(conversationId, senderId, senderName, finalContent, finalTranslatedContent);

        // Emit real-time event
        try {
            const io = socketManager.getIO();

            // Emit to recipient only (sender already has the message from API response)
            const recipientId = senderId === conversation.teacher_id ? conversation.student_id : conversation.teacher_id;

            // Emit to recipient's user room
            // Inject sender role for frontend styling (Critical for Admin styling)
            io.to(String(recipientId)).emit('new_message', {
                ...message,
                role: req.user.role
            });

        } catch (error) {
            console.error('Socket emit error:', error);
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message,
            ...(translationFailed && { translationWarning: 'Message sent, but automatic translation was unavailable (limit reached).' })
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while sending message'
        });
    }
};

// @desc    Mark conversation as read
// @route   PUT /api/messages/conversations/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const userId = parseInt(req.user.id, 10); // Ensure integer

        await Conversation.markAsRead(conversationId, userId);

        // Emit socket event to notify frontends that this conversation is read
        // This ensures unread badges clear on all devices/tabs
        try {
            const io = socketManager.getIO();
            io.to(String(userId)).emit('conversation_read', {
                conversation_id: conversationId,
                user_id: userId
            });
        } catch (socketError) {
            console.error('Socket emit error (markAsRead):', socketError);
        }

        res.json({
            success: true,
            message: 'Marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete conversation
// @route   DELETE /api/messages/conversations/:id
// @access  Private (Admin only)
exports.deleteConversation = async (req, res) => {
    try {
        const conversationId = req.params.id;

        // Check if admin
        if (req.user.role !== 'admin' && req.user.role !== 'super admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete conversations'
            });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Multi-tenant isolation: a school admin may only delete their own school's conversations
        if (req.user.role === 'admin' && req.user.school_id && conversation.student_school_id !== req.user.school_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this conversation (School Mismatch)'
            });
        }

        await Conversation.delete(conversationId);

        try {
            logAction(req.user.id, req.user.email, 'DELETE_CONVERSATION', 'conversation', conversationId, {
                student_id: conversation.student_id,
                teacher_id: conversation.teacher_id
            }, req);
        } catch (e) { console.error('Audit log error', e); }

        res.json({
            success: true,
            message: 'Conversation deleted successfully',
            data: { id: conversationId }
        });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting conversation'
        });
    }
};

// @desc    Send bulk group message
// @route   POST /api/messages/group
// @access  Private (Teacher/Admin)
exports.sendGroupMessage = async (req, res) => {
    try {
        const { studentIds, content } = req.body;
        const senderId = req.user.id;
        const senderName = displayName(req.user);

        // Only teachers and admins may broadcast group messages
        if (!['teacher', 'admin', 'super admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized to send group messages' });
        }

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No recipients selected' });
        }
        if (!content) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }
        if (content.length > 5000) {
            return res.status(400).json({ success: false, message: 'Message is too long (max 5000 characters)' });
        }

        const results = [];
        const io = socketManager.getIO();

        const schoolId = req.user.school_id;

        // Multi-tenant isolation: every recipient must be a student in the sender's school
        if (req.user.role !== 'super admin') {
            const allowed = await db.query(
                `SELECT id FROM users WHERE role = 'student' AND school_id = $1 AND id = ANY($2::int[])`,
                [schoolId, studentIds]
            );
            if (allowed.rows.length !== studentIds.length) {
                return res.status(403).json({ success: false, message: 'One or more recipients are not in your school' });
            }
        }

        // Process sequentially to manage DB connection load
        // Note: In production with many concurrent users, a queue system (Bull/Redis) is better.
        for (const studentId of studentIds) {
            try {
                // 1. Find or Create Conversation
                // Check if one exists manually
                let conversationResult = await db.query(
                    `SELECT c.id, l.name as preferred_language 
                     FROM conversations c
                     JOIN users s ON c.student_id = s.id
                     LEFT JOIN student_profiles sp ON s.id = sp.user_id
                     LEFT JOIN languages l ON sp.preferred_language_id = l.id
                     WHERE c.student_id = $1 AND c.teacher_id = $2`,
                    [studentId, senderId]
                );

                let conversationId;
                let targetLang = 'English';

                if (conversationResult.rows.length > 0) {
                    conversationId = conversationResult.rows[0].id;
                    targetLang = conversationResult.rows[0].preferred_language || 'English';
                } else {
                    // Create new conversation
                    // We must use the model or raw query. Using Conversation.create for consistency.
                    const newConv = await Conversation.create(studentId, senderId, 'Group Message');
                    conversationId = newConv.id;

                    // Fetch language for new convo
                    const profile = await db.query(
                        `SELECT l.name as preferred_language 
                         FROM student_profiles sp
                         LEFT JOIN languages l ON sp.preferred_language_id = l.id
                         WHERE sp.user_id = $1`,
                        [studentId]
                    );
                    targetLang = profile.rows[0]?.preferred_language || 'English';
                }

                // 2. Translation Logic
                let finalContent = content;
                let finalTranslatedContent = null;

                if (targetLang && targetLang !== 'English') {
                    try {
                        finalTranslatedContent = await performTranslation(content, targetLang, schoolId);
                    } catch (err) {
                        console.warn(`Translation skipped for student ${studentId}:`, err.message);
                    }
                }

                // 3. Add Message
                const message = await Conversation.addMessage(conversationId, senderId, senderName, finalContent, finalTranslatedContent);

                // 4. Socket Emit
                if (io) {
                    io.to(String(studentId)).emit('new_message', {
                        ...message,
                        role: req.user.role
                    });
                }

                results.push({ studentId, status: 'sent', messageId: message.id });

            } catch (err) {
                console.error(`Group send error for student ${studentId}:`, err);
                results.push({ studentId, status: 'failed', error: err.message });
            }
        }

        res.json({
            success: true,
            message: `Processed ${results.length} messages`,
            data: results
        });

    } catch (error) {
        console.error('Group message error:', error);
        res.status(500).json({ success: false, message: 'Server error during bulk send' });
    }
};
