const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const checkLanguageAccess = require('../middleware/checkLanguageAccess');

// @route   GET /api/students/dashboard-stats
// @desc    Get dashboard statistics for logged-in student
router.get('/dashboard-stats', protect, authorize('student'), studentController.getDashboardStats);

// @route   GET /api/students/count
// @desc    Get student count
router.get('/count', protect, authorize('admin'), studentController.getStudentCount);

// @route   GET /api/students/grade/:gradeId
// @desc    Get students by grade
router.get('/grade/:gradeId', protect, studentController.getStudentsByGrade);

// @route   POST /api/students/bulk-grade-update
// @desc    Bulk update student grades
router.post('/bulk-grade-update', protect, authorize('admin'), studentController.bulkUpdateGrades);

// @route   GET /api/students
// @desc    Get all students
router.get('/', protect, studentController.getAllStudents);

// @route   GET /api/students/:id
// @desc    Get student by ID
router.get('/:id', protect, studentController.getStudentById);

// @route   PUT /api/students/:id/profile
// @desc    Update student profile
router.put('/:id/profile', protect, checkLanguageAccess, studentController.updateStudentProfile);

module.exports = router;
