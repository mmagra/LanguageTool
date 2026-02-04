const Student = require('../models/Student');
const db = require('../config/database');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
exports.getAllStudents = async (req, res) => {
    try {
        // Filter by school if user has a school_id (Teachers/Admins)
        // Super Admins might not have school_id, so they see all (or we can handle that later)
        const schoolId = req.user.school_id;
        const students = await Student.getAll(schoolId);

        res.json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching students'
        });
    }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching student'
        });
    }
};

// @desc    Update student profile
// @route   PUT /api/students/:id/profile
// @access  Private
exports.updateStudentProfile = async (req, res) => {
    try {
        const studentId = req.params.id;
        // Verify that the user updating the profile is the owner or an admin
        if (req.user.role !== 'admin' && req.user.id.toString() !== studentId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }

        const {
            // User fields
            first_name,
            last_name,
            phone,
            about,
            profile_image,
            // Password fields
            currentPassword,
            newPassword,
            // Student Profile fields
            grade_id,
            guardian_name,
            guardian_relation,
            preferred_language, // Legacy support (optional)
            preferred_language_id, // New Schema Support
            institution,
            learning_goals
        } = req.body;

        const User = require('../models/User');

        // 1. Handle Password Change (if provided)
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required to set a new password'
                });
            }

            const user = await User.findById(studentId);
            // We need password hash for comparison, findById might not return it depending on implementation
            // Let's use findByEmail or a specific method to get password if needed, 
            // but usually Auth middleware attaches user. Let's check DB directly to be safe.
            const userWithPassword = await db.query('SELECT password_hash FROM users WHERE id = $1', [studentId]);
            if (userWithPassword.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const isMatch = await User.comparePassword(currentPassword, userWithPassword.rows[0].password_hash);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Incorrect current password'
                });
            }

            // Hash new password
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await User.updatePassword(studentId, hashedPassword);
        }

        // 2. Update User Basic Details
        const updatedUser = await User.updateDetails(studentId, {
            first_name,
            last_name,
            phone,
            about,
            profile_image
        });

        // 3. Update Student Profile Specifics
        const updatedProfile = await Student.updateProfile(studentId, {
            grade_id,
            guardian_name,
            guardian_relation,
            grade_id,
            guardian_name,
            guardian_relation,
            preferred_language, // Pass legacy if needed, or better, logic to resolve ID if only name provided?
            // For now, we prefer ID. If ID is provided, it overrides/is used.
            preferred_language_id,
            institution,
            learning_goals
        });

        // Emit socket event for profile update
        const socketManager = require('../socket/socketManager');
        const io = socketManager.getIO();
        if (io) {
            io.emit('profile_updated', { userId: studentId });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                ...updatedUser,
                ...updatedProfile
            }
        });
    } catch (error) {
        console.error('Update student profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
};

// @desc    Get students by grade
// @route   GET /api/students/grade/:gradeId
// @access  Private
exports.getStudentsByGrade = async (req, res) => {
    try {
        const students = await Student.getByGrade(req.params.gradeId, req.user.school_id);

        res.json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Get students by grade error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching students'
        });
    }
};

// @desc    Get student count
// @route   GET /api/students/count
// @access  Private/Admin
exports.getStudentCount = async (req, res) => {
    try {
        const count = await Student.getCount(req.user.school_id);

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get student count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching count'
        });
    }
};

// @desc    Bulk update student grades
// @route   POST /api/students/bulk-grade-update
// @access  Private/Admin
exports.bulkUpdateGrades = async (req, res) => {
    try {
        const { studentIds, newGradeId } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a list of student IDs'
            });
        }

        if (!newGradeId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a new grade ID'
            });
        }

        const updatedStudents = await Student.updateGradesBulk(studentIds, newGradeId);

        res.json({
            success: true,
            message: `Successfully updated grades for ${updatedStudents.length} students`,
            data: updatedStudents
        });

    } catch (error) {
        console.error('Bulk update grades error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating grades'
        });
    }
};

// @desc    Get dashboard statistics for student
// @route   GET /api/students/dashboard-stats
// @access  Private/Student
exports.getDashboardStats = async (req, res) => {
    try {
        // Log full user object for debugging
        console.log('[DEBUG-STATS] Full User:', JSON.stringify(req.user, null, 2));

        const studentId = req.user.id;
        console.log(`[DEBUG-STATS] Fetching stats for student_id: ${studentId}`);

        // Simple query strictly on conversations table first
        const conversationQuery = `
            SELECT 
                COUNT(*) as conversation_count,
                COUNT(DISTINCT teacher_id) as teacher_count
            FROM conversations
            WHERE student_id = $1
        `;

        const result = await db.query(conversationQuery, [studentId]);
        console.log('[DEBUG-STATS] Query Result Rows:', result.rows);

        const row = result.rows[0];
        const stats = {
            teacherCount: parseInt(row.teacher_count) || 0,
            conversationCount: parseInt(row.conversation_count) || 0
        };

        console.log('[DEBUG-STATS] Final Stats:', stats);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard statistics'
        });
    }
};

