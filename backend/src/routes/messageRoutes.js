const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');
const requireSchoolActive = require('../middleware/requireSchoolActive');
const requireSchoolValid = require('../middleware/requireSchoolValid');
const { messageLimiter } = require('../middleware/rateLimiter');

router.use(protect);
router.use(requireSchoolActive);
router.use(requireSchoolValid);

router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageLimiter, messageController.createConversation);
router.get('/conversations/:id', messageController.getConversationById);
router.post('/conversations/:id/messages', messageLimiter, messageController.sendMessage);
router.post('/group', authorize('teacher', 'admin', 'super admin'), messageLimiter, messageController.sendGroupMessage);
router.put('/conversations/:id/read', messageController.markAsRead);
router.delete('/conversations/:id', authorize('admin', 'super admin'), messageController.deleteConversation);

module.exports = router;
