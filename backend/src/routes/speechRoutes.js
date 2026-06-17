const express = require('express');
const router = express.Router();
const speechController = require('../controllers/speechController');
const { protect } = require('../middleware/auth');
const { translateLimiter } = require('../middleware/rateLimiter');
const requireSchoolValid = require('../middleware/requireSchoolValid');

// POST /api/speech/tts — premium Text-to-Speech (auth + active subscription + rate-limited + per-school gated)
router.post('/tts', protect, requireSchoolValid, translateLimiter, speechController.synthesize);

module.exports = router;
