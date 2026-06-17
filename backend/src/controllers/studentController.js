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

        // School isolation: non-super-admins may only access students in their own school.
        const isSuper = req.user.role === 'super admin' || req.user.is_super_admin;
        if (!isSuper && student.school_id !== req.user.school_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
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
        const isSuper = req.user.role === 'super admin' || req.user.is_super_admin;
        // Verify that the user updating the profile is the owner, an admin, or super admin
        if (req.user.role !== 'admin' && !isSuper && req.user.id.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }
        // A school admin may only edit students in their own school
        if (req.user.role === 'admin') {
            const target = await Student.findById(studentId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            if (target.school_id !== req.user.school_id) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
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
        // Language is stored as preferred_language_id (FK). Student.updateProfile only
        // honors grade_id, guardian_name, guardian_relation, preferred_language_id.
        const updatedProfile = await Student.updateProfile(studentId, {
            grade_id,
            guardian_name,
            guardian_relation,
            preferred_language_id
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

        // Multi-tenant isolation: a school admin may only update students in their own school.
        const isSuperAdmin = req.user.role === 'super admin';
        if (!isSuperAdmin && !req.user.school_id) {
            return res.status(403).json({ success: false, message: 'No school context for this operation' });
        }
        const scopeSchoolId = isSuperAdmin ? null : req.user.school_id;

        const updatedStudents = await Student.updateGradesBulk(studentIds, newGradeId, scopeSchoolId);

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

        const studentId = req.user.id;

        // Simple query strictly on conversations table first
        const conversationQuery = `
            SELECT 
                COUNT(*) as conversation_count,
                COUNT(DISTINCT teacher_id) as teacher_count
            FROM conversations
            WHERE student_id = $1
        `;

        const result = await db.query(conversationQuery, [studentId]);

        const row = result.rows[0];
        const stats = {
            teacherCount: parseInt(row.teacher_count) || 0,
            conversationCount: parseInt(row.conversation_count) || 0
        };


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

