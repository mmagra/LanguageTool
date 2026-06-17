const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const checkLanguageAccess = require('../middleware/checkLanguageAccess');
const requireSchoolActive = require('../middleware/requireSchoolActive');
const requireSchoolValid = require('../middleware/requireSchoolValid');

router.use(protect);
router.use(requireSchoolActive);
router.use(requireSchoolValid);

// @route   GET /api/students
// @desc    Get all students
router.get('/', studentController.getAllStudents);

// @route   GET /api/students/dashboard-stats
// @desc    Get dashboard statistics for logged-in student
router.get('/dashboard-stats', authorize('student'), studentController.getDashboardStats);
router.get('/count', authorize('admin'), studentController.getStudentCount);
router.get('/grade/:gradeId', studentController.getStudentsByGrade);
router.post('/bulk-grade-update', authorize('admin'), studentController.bulkUpdateGrades);
router.get('/:id', studentController.getStudentById);
router.put('/:id/profile', checkLanguageAccess, studentController.updateStudentProfile);

module.exports = router;
