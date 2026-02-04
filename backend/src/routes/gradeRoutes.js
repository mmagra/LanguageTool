const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');

// @route   GET /api/grades
// @desc    Get all grades
router.get('/', gradeController.getAllGrades);

// @route   GET /api/grades/:id
// @desc    Get grade by ID
router.get('/:id', gradeController.getGradeById);

module.exports = router;
