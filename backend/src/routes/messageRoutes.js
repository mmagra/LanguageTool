const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
router.get('/conversations', protect, messageController.getConversations);

// @route   POST /api/messages/conversations
// @desc    Create new conversation
router.post('/conversations', protect, messageController.createConversation);

// @route   GET /api/messages/conversations/:id
// @desc    Get conversation with messages
router.get('/conversations/:id', protect, messageController.getConversationById);

// @route   POST /api/messages/conversations/:id/messages
// @desc    Send message in conversation
router.post('/conversations/:id/messages', protect, messageController.sendMessage);

// @route   POST /api/messages/group
// @desc    Send bulk group message with auto-translation
router.post('/group', protect, messageController.sendGroupMessage);

// @route   PUT /api/messages/conversations/:id/read
// @desc    Mark conversation as read
router.put('/conversations/:id/read', protect, messageController.markAsRead);

// @route   DELETE /api/messages/conversations/:id
// @desc    Delete conversation (Admin only)
router.delete('/conversations/:id', protect, messageController.deleteConversation);

module.exports = router;
