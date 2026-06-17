const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Public routes (rate-limited)
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);

// Private routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/password', protect, authController.changePassword);
router.put('/profile', protect, authController.updateProfile);

module.exports = router;