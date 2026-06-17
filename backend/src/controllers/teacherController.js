const Teacher = require('../models/Teacher');
const db = require('../config/database');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private/Admin
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.getAll(req.user.school_id);

        res.json({
            success: true,
            count: teachers.length,
            data: teachers
        });
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching teachers'
        });
    }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // School isolation: non-super-admins may only access teachers in their own school.
        const isSuper = req.user.role === 'super admin' || req.user.is_super_admin;
        if (!isSuper && teacher.school_id !== req.user.school_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (error) {
        console.error('Get teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching teacher'
        });
    }
};

// @desc    Update teacher profile
// @route   PUT /api/teachers/:id/profile
// @access  Private
exports.updateTeacherProfile = async (req, res) => {
    try {
        const teacherId = req.params.id;
        const profileData = req.body;

        const User = require('../models/User'); // Import User model

        // Authorization: only the teacher themselves or an admin/super-admin may update this profile.
        const target = await User.findById(teacherId);
        if (!target) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }
        const isSelf = parseInt(req.user.id, 10) === parseInt(teacherId, 10);
        const isAdmin = req.user.role === 'admin' || req.user.role === 'super admin';
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        }
        // Multi-tenant isolation for school admins: target must be in the same school.
        if (req.user.role === 'admin' && req.user.school_id && target.school_id !== req.user.school_id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this profile (School Mismatch)' });
        }

        // Check validation for email/username updates if provided
        if (req.body.email || req.body.username) {
            const currentUser = await Teacher.findById(teacherId); // Or User.findById

            // Check email uniqueness
            if (req.body.email && req.body.email !== currentUser.email) {
                const emailExists = await User.emailExists(req.body.email);
                if (emailExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
            }

            // Check username uniqueness
            if (req.body.username && req.body.username !== currentUser.username) {
                const usernameExists = await User.usernameExists(req.body.username);
                if (usernameExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Employee ID (Username) already in use'
                    });
                }
            }
        }

        // Update user details first (first_name, last_name, phone, about, profile_image, email, username)
        const userUpdateData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            phone: req.body.phone,
            about: req.body.about,
            profile_image: req.body.profile_image,
            email: req.body.email,
            username: req.body.username
        };
        await User.updateDetails(teacherId, userUpdateData);

        const updatedProfile = await Teacher.updateProfile(teacherId, profileData);

        if (!updatedProfile) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Emit socket event for profile update
        const socketManager = require('../socket/socketManager');
        const io = socketManager.getIO();
        if (io) {
            io.emit('profile_updated', { userId: teacherId });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        });
    } catch (error) {
        console.error('Update teacher profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
};

// @desc    Get teacher count
// @route   GET /api/teachers/count
// @access  Private/Admin
exports.getTeacherCount = async (req, res) => {
    try {
        const count = await Teacher.getCount(req.user.school_id);

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Get teacher count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching count'
        });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/teachers/dashboard-stats
// @access  Private
const vader = require('vader-sentiment');

exports.getDashboardStats = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const schoolId = req.user.school_id;

        const teacherCountQuery = "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND school_id = $1 AND status NOT IN ('pending', 'rejected')";
        const studentCountQuery = "SELECT COUNT(*) FROM users WHERE role = 'student' AND school_id = $1 AND status NOT IN ('pending', 'rejected')";
        const conversationCountQuery = "SELECT COUNT(*) FROM conversations WHERE teacher_id = $1";

        const messagesQuery = `
            SELECT m.conversation_id, m.content 
            FROM messages m 
            JOIN conversations c ON m.conversation_id = c.id 
            WHERE c.teacher_id = $1
        `;

        // Monthly stats for the last 6 months
        const chartDataQuery = `
            SELECT 
                CAST(EXTRACT(MONTH FROM created_at) AS INTEGER) as month_num,
                COUNT(*) as count
            FROM conversations 
            WHERE 
                teacher_id = $1 
                AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
            GROUP BY 1
            ORDER BY 1 ASC
        `;

        // Language distribution stats
        const languageDataQuery = `
            SELECT l.name as preferred_language, COUNT(c.id) as count
            FROM conversations c
            JOIN users s ON c.student_id = s.id
            JOIN student_profiles sp ON s.id = sp.user_id
            JOIN languages l ON sp.preferred_language_id = l.id
            WHERE c.teacher_id = $1
            GROUP BY l.name
            ORDER BY count DESC
            `;

        const [teacherCountResult, studentCountResult, conversationCountResult, chartDataResult, messagesResult, languageDataResult] = await Promise.all([
            db.query(teacherCountQuery, [schoolId]),
            db.query(studentCountQuery, [schoolId]),
            db.query(conversationCountQuery, [teacherId]),
            db.query(chartDataQuery, [teacherId]),
            db.query(messagesQuery, [teacherId]),
            db.query(languageDataQuery, [teacherId])
        ]);

        // Process chart data to ensure all 6 months are present
        const statsMap = new Map();
        chartDataResult.rows.forEach(row => {
            statsMap.set(row.month_num, parseInt(row.count));
        });

        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const monthNum = d.getMonth() + 1; // 1-12 (JS is 0-11)

            chartData.push({
                month: monthName,
                conversations: statsMap.get(monthNum) || 0
            });
        }

        // --- Calculate Sentiment Stats (On-demand) ---
        // Mirroring frontend logic from Conversations.jsx
        const conversationScores = {}; // { conversationId: { totalScore: 0, count: 0 } }

        messagesResult.rows.forEach(msg => {
            // Basic HTML strip (backend equivalent of frontend logic)
            const text = (msg.content || '').replace(/<[^>]*>?/gm, '');
            if (!text.trim()) return;

            const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);
            const compound = result.compound;

            if (!conversationScores[msg.conversation_id]) {
                conversationScores[msg.conversation_id] = { totalScore: 0, count: 0 };
            }

            // Skip Neutral: Only count if score is outside [-0.05, 0.05]
            if (compound > 0.05) {
                conversationScores[msg.conversation_id].totalScore += 1; // Round Positive to +1
                conversationScores[msg.conversation_id].count++;
            } else if (compound < -0.05) {
                conversationScores[msg.conversation_id].totalScore += -1; // Round Negative to -1
                conversationScores[msg.conversation_id].count++;
            }
        });

        // Initialize buckets
        const buckets = {
            '0-1': 0,
            '1-2': 0,
            '2-3': 0,
            '3-4': 0,
            '4-5': 0
        };

        // If a conversation has messages but no non-neutral ones, or no messages,
        // we need to decide how to handle it. Frontend defaults to 0 if count <= 0.
        // We will include all conversations that were returned by the query? 
        // Actually, the query joins messages. If a conversation has NO messages, it won't appear in messagesResult.
        // But we want to count active conversations. The user only asked for "Conversation Satisfaction Levels".
        // We will iterate over the conversations we found messages for.

        Object.values(conversationScores).forEach(({ totalScore, count }) => {
            let level = 0;
            if (count > 0) {
                const avgCompound = totalScore / count;
                // Convert -1..1 to 0..5
                level = ((avgCompound + 1) / 2) * 5;
            }
            // level is 0..5

            // Bucketize
            // 0.0 - 1.0 (inclusive of 1.0? usually ranges are [x, y))
            // Let's stick to simple logic:
            if (level <= 1.0) buckets['0-1']++;
            else if (level <= 2.0) buckets['1-2']++;
            else if (level <= 3.0) buckets['2-3']++;
            else if (level <= 4.0) buckets['3-4']++;
            else buckets['4-5']++;
        });

        const sentimentData = [
            { range: '0-1', conversations: buckets['0-1'] },
            { range: '1-2', conversations: buckets['1-2'] },
            { range: '2-3', conversations: buckets['2-3'] },
            { range: '3-4', conversations: buckets['3-4'] },
            { range: '4-5', conversations: buckets['4-5'] }
        ];

        const stats = {
            teacherCount: parseInt(teacherCountResult.rows[0].count) || 0,
            studentCount: parseInt(studentCountResult.rows[0].count) || 0,
            conversationCount: parseInt(conversationCountResult.rows[0].count) || 0,
            chartData,
            sentimentData,
            languageData: languageDataResult.rows.map(row => ({
                language: row.preferred_language || 'Unknown',
                conversations: parseInt(row.count)
            }))
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get teacher dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard statistics'
        });
    }
};
