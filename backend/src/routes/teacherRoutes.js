const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/teachers/count
// @desc    Get teacher count
router.get('/count', protect, authorize('admin'), teacherController.getTeacherCount);

// @route   GET /api/teachers/dashboard-stats
// @desc    Get dashboard stats
router.get('/dashboard-stats', protect, authorize('teacher'), teacherController.getDashboardStats);

// @route   GET /api/teachers
// @desc    Get all teachers
router.get('/', protect, teacherController.getAllTeachers);

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID
router.get('/:id', protect, teacherController.getTeacherById);

// @route   PUT /api/teachers/:id/profile
// @desc    Update teacher profile
router.put('/:id/profile', protect, teacherController.updateTeacherProfile);

module.exports = router;
