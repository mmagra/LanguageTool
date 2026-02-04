const Conversation = require('../models/Conversation');
const db = require('../config/database');
const socketManager = require('../socket/socketManager');
const { isUserOnline } = require('../socket/socketManager');
const { performTranslation } = require('./translationController');

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

        // DEBUG: Check unread counts
        conversations.forEach(c => {
            if (parseInt(c.unread_count) > 0) {
                console.log(`[DEBUG] Conv ${c.id} has ${c.unread_count} unread messages for User ${userId}`);
            }
        });

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
        const senderName = `${req.user.firstName} ${req.user.lastName}`;

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

        // Auto-translate if Teacher -> Student
        // Auto-translate Student message (Bi-directional Strict Rule)
        // Goal: content = English, translated_content = Native

        let finalContent = content;
        let finalTranslatedContent = translatedContent;

        if (!finalTranslatedContent && req.user.role === 'student') {
            const targetLang = conversation.preferred_language; // Native Language
            const inputLang = req.body.inputLanguage || 'English';

            if (targetLang && targetLang !== 'English') {
                try {
                    if (inputLang === 'English') {
                        // Scenario A: Input is English
                        // content = English (As is)
                        // translated_content = English -> Native
                        finalTranslatedContent = await performTranslation(content, targetLang);
                    } else {
                        // Scenario B: Input is Native
                        // content = Native -> English
                        // translated_content = Native (As is)
                        finalContent = await performTranslation(content, 'English');
                        finalTranslatedContent = content; // Store original Native input as translated_content
                    }
                } catch (err) {
                    console.warn('Auto-translation failed:', err.message);
                }
            }
        } else if (!finalTranslatedContent && (req.user.role === 'teacher' || req.user.role === 'admin')) {
            // Teacher/Admin Logic (assumes Input is English)
            const targetLang = conversation.preferred_language;
            if (targetLang && targetLang !== 'English') {
                try {
                    finalTranslatedContent = await performTranslation(content, targetLang);
                } catch (err) {
                    console.warn('Auto-translation failed:', err.message);
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
            data: message
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
        if (req.user.role !== 'admin') {
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

        await Conversation.delete(conversationId);

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
        const senderName = `${req.user.firstName} ${req.user.lastName}`;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No recipients selected' });
        }
        if (!content) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        const results = [];
        const io = socketManager.getIO();

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
                        finalTranslatedContent = await performTranslation(content, targetLang);
                    } catch (err) {
                        console.warn(`Translation failed for student ${studentId}:`, err.message);
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
