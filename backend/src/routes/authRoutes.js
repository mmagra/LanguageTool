const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Private routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/password', protect, require('../controllers/authController').changePassword);
router.put('/profile', protect, updateProfile);

module.exports = router;