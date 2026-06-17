const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const requireSchoolActive = require('../middleware/requireSchoolActive');
const requireSchoolValid = require('../middleware/requireSchoolValid');

router.use(protect);
router.use(requireSchoolActive);
router.use(requireSchoolValid);

router.get('/count', authorize('admin'), teacherController.getTeacherCount);
router.get('/dashboard-stats', authorize('teacher'), teacherController.getDashboardStats);
router.get('/', teacherController.getAllTeachers);
router.get('/:id', teacherController.getTeacherById);
router.put('/:id/profile', authorize('teacher', 'admin', 'super admin'), teacherController.updateTeacherProfile);

module.exports = router;
