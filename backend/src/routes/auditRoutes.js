const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

router.get('/super-admin/audit-logs', protect, requireSuperAdmin, auditController.getAuditLogs);

module.exports = router;
