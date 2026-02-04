const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/sessions/start
// @desc    Start In-Person Session
router.post('/start', protect, authorize('teacher'), sessionController.startSession);

// @route   POST /api/sessions/end
// @desc    End In-Person Session
router.post('/end', protect, authorize('teacher'), sessionController.endSession);

// @route   GET /api/sessions/active
// @desc    Get Active Session
router.get('/active', protect, authorize('teacher'), sessionController.getActiveSession);

module.exports = router;
