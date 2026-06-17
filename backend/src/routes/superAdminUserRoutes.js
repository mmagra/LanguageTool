const express = require('express');
const router = express.Router();
const userController = require('../controllers/superAdminUserController');
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

router.get('/super-admin/users', protect, requireSuperAdmin, userController.getAllUsers);
// check-availability must be before /:id to avoid route shadowing
router.post('/super-admin/users/check-availability', protect, requireSuperAdmin, userController.checkUserAvailability);
router.post('/super-admin/users', protect, requireSuperAdmin, userController.createUser);
router.put('/super-admin/users/:id', protect, requireSuperAdmin, userController.updateUser);

module.exports = router;
