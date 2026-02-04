const Grade = require('../models/Grade');

// @desc    Get all grades
// @route   GET /api/grades
// @access  Public
exports.getAllGrades = async (req, res) => {
    try {
        const grades = await Grade.getAll();

        res.json({
            success: true,
            count: grades.length,
            data: grades
        });
    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching grades'
        });
    }
};

// @desc    Get grade by ID
// @route   GET /api/grades/:id
// @access  Public
exports.getGradeById = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grade not found'
            });
        }

        res.json({
            success: true,
            data: grade
        });
    } catch (error) {
        console.error('Get grade error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching grade'
        });
    }
};
