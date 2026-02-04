const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/brandingController');
const { protect } = require('../middleware/auth');

router.get('/system/branding', protect, brandingController.getMySchoolBranding);

module.exports = router;
