const express = require('express');
const router = express.Router();
const { translateText } = require('../controllers/translationController');
const { protect } = require('../middleware/auth');
const { translateLimiter } = require('../middleware/rateLimiter');
const requireSchoolValid = require('../middleware/requireSchoolValid');

// POST /api/translate — requires auth, active subscription, and rate-limited
router.post('/', protect, requireSchoolValid, translateLimiter, translateText);

module.exports = router;
