const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPendingUsers,
  getDeniedUsers,
  handleUserApproval,
  getAllUsers,
  getUserById,
  deleteUser,
  getAdmins,
  createAdmin,
  resetPassword,
  updateAdminProfile
} = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const requireSchoolActive = require('../middleware/requireSchoolActive');
const requireSchoolValid = require('../middleware/requireSchoolValid');
const Joi = require('joi');

router.use(auth);
router.use(authorize('admin'));
router.use(requireSchoolActive);
router.use(requireSchoolValid);

// Dashboard stats route
router.get('/dashboard-stats', getDashboardStats);

// User approval routes
router.get('/pending-users', getPendingUsers);
router.get('/denied-users', getDeniedUsers);
router.put('/users/:id/approval', handleUserApproval);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);

// Admin management routes
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/users/:id/password', resetPassword);
router.put('/users/:id/profile', updateAdminProfile);

module.exports = router;