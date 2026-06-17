const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { protect } = require('../middleware/auth');

// Public grade list for the registration page (must be declared before '/:id')
router.get('/public', gradeController.getAllGrades);

router.get('/', protect, gradeController.getAllGrades);
router.get('/:id', protect, gradeController.getGradeById);

module.exports = router;
