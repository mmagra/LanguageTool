const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

// Alerts and Audit Log routes
router.get('/super-admin/alerts', protect, requireSuperAdmin, alertsController.getAlerts);
router.get('/super-admin/audit-logs', protect, requireSuperAdmin, alertsController.getAuditLogs);

module.exports = router;
