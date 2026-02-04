const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

// Analytics routes
router.get('/super-admin/analytics/overview', protect, requireSuperAdmin, analyticsController.getAnalyticsOverview);

module.exports = router;
