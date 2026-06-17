const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

// Alerts routes
// NOTE: /super-admin/audit-logs is intentionally handled by auditController (see auditRoutes.js),
// which matches the frontend's expected response shape and filters. Do not re-add it here.
router.get('/super-admin/alerts', protect, requireSuperAdmin, alertsController.getAlerts);

module.exports = router;
