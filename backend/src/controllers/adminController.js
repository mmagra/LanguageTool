const User = require('../models/User');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const vader = require('vader-sentiment');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const params = schoolId ? [schoolId] : [];

    // Only count active/approved users
    let teacherCountQuery = "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status NOT IN ('pending', 'rejected')";
    let studentCountQuery = "SELECT COUNT(*) FROM users WHERE role = 'student' AND status NOT IN ('pending', 'rejected')";
    let conversationCountQuery = "SELECT COUNT(*) FROM conversations"; // Conversation count usually implies active users anyway, but table is conversations not users.

    let chartDataQuery = `
            SELECT 
                CAST(EXTRACT(MONTH FROM created_at) AS INTEGER) as month_num,
                COUNT(*) as count
            FROM conversations 
            WHERE 
                created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
            GROUP BY 1
            ORDER BY 1 ASC
        `;

    let messagesQuery = `
            SELECT m.conversation_id, m.content 
            FROM messages m
        `;

    let languageDataQuery = `
            SELECT l.name as preferred_language, COUNT(c.id) as count
            FROM conversations c
            JOIN users s ON c.student_id = s.id
            JOIN student_profiles sp ON s.id = sp.user_id
            JOIN languages l ON sp.preferred_language_id = l.id
            GROUP BY l.name
            ORDER BY count DESC
        `;

    // Apply filtering if schoolId is present
    if (schoolId) {
      teacherCountQuery += " AND school_id = $1";
      studentCountQuery += " AND school_id = $1";
      // conversationCountQuery update is complex, handled below
      conversationCountQuery = "SELECT COUNT(*) FROM conversations c JOIN users u ON c.student_id = u.id WHERE u.school_id = $1";

      chartDataQuery = `
            SELECT 
                CAST(EXTRACT(MONTH FROM c.created_at) AS INTEGER) as month_num,
                COUNT(*) as count
            FROM conversations c
            JOIN users u ON c.student_id = u.id
            WHERE 
                u.school_id = $1 AND
                c.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
            GROUP BY 1
            ORDER BY 1 ASC
        `;

      messagesQuery = `
            SELECT m.conversation_id, m.content 
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            JOIN users u ON c.student_id = u.id
            WHERE u.school_id = $1
        `;

      languageDataQuery = `
            SELECT l.name as preferred_language, COUNT(c.id) as count
            FROM conversations c
            JOIN users s ON c.student_id = s.id
            JOIN student_profiles sp ON s.id = sp.user_id
            JOIN languages l ON sp.preferred_language_id = l.id
            WHERE s.school_id = $1
            GROUP BY l.name
            ORDER BY count DESC
        `;
    }

    const [teacherCountResult, studentCountResult, conversationCountResult, chartDataResult, messagesResult, languageDataResult] = await Promise.all([
      db.query(teacherCountQuery, params),
      db.query(studentCountQuery, params),
      db.query(conversationCountQuery, params),
      db.query(chartDataQuery, params),
      db.query(messagesQuery, params),
      db.query(languageDataQuery, params)
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

    // --- Calculate Sentiment Stats (Aggregated for entire platform) ---
    const conversationScores = {}; // { conversationId: { totalScore: 0, count: 0 } }

    messagesResult.rows.forEach(msg => {
      // Basic HTML strip
      const text = (msg.content || '').replace(/<[^>]*>?/gm, '');
      if (!text.trim()) return;

      const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);
      const compound = result.compound;

      if (!conversationScores[msg.conversation_id]) {
        conversationScores[msg.conversation_id] = { totalScore: 0, count: 0 };
      }

      // Skip Neutral
      if (compound > 0.05) {
        conversationScores[msg.conversation_id].totalScore += 1;
        conversationScores[msg.conversation_id].count++;
      } else if (compound < -0.05) {
        conversationScores[msg.conversation_id].totalScore += -1;
        conversationScores[msg.conversation_id].count++;
      }
    });

    const buckets = {
      '0-1': 0,
      '1-2': 0,
      '2-3': 0,
      '3-4': 0,
      '4-5': 0
    };

    Object.values(conversationScores).forEach(({ totalScore, count }) => {
      let level = 0;
      if (count > 0) {
        const avgCompound = totalScore / count;
        level = ((avgCompound + 1) / 2) * 5;
      }

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
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

// @desc    Get all pending users
// @route   GET /api/admin/pending-users
// @access  Private/Admin
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.getPendingUsers(req.user.school_id);

    res.json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });

  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending users'
    });
  }
};

// @desc    Get all denied users
// @route   GET /api/admin/denied-users
// @access  Private/Admin
exports.getDeniedUsers = async (req, res) => {
  try {
    const deniedUsers = await User.getDeniedUsers(req.user.school_id);

    res.json({
      success: true,
      count: deniedUsers.length,
      data: deniedUsers
    });

  } catch (error) {
    console.error('Get denied users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching denied users'
    });
  }
};

// @desc    Approve or reject a user
// @route   PUT /api/admin/users/:id/approval
// @access  Private/Admin
exports.handleUserApproval = async (req, res) => {
  try {
    const userId = req.params.id;
    const { action } = req.body;
    const adminId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    let updatedUser;

    if (action === 'approve') {
      updatedUser = await User.approveUser(userId, adminId);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found or already processed'
        });
      }
    } else {
      updatedUser = await User.rejectUser(userId, adminId);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found or already processed'
        });
      }
    }

    res.json({
      success: true,
      message: `User ${action}d successfully`,
      data: updatedUser
    });

  } catch (error) {
    console.error('User approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing user approval'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers(req.user.school_id);

    res.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists and get role
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is admin, check if they are the last one
    if (userToDelete.role === 'admin') {
      const admins = await User.getAdmins();
      if (admins.length <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last administrator. At least one admin must exist.'
        });
      }
    }

    await User.delete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

// @desc    Get all admins
// @route   GET /api/admin/admins
// @access  Private/Admin
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.getAdmins(req.user.school_id);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.removeHeader('Etag'); // Explicitly remove Etag

    res.json({
      success: true,
      count: admins.length,
      data: admins
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admins'
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/users/:id/profile
// @access  Private/Admin
exports.updateAdminProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { first_name, last_name, phone, about, profile_image, email } = req.body;

    // Verify the user is updating their own profile or is a super admin (for now assume own profile)
    if (req.user.id !== userId) {
      // Optional logic
    }

    // Check email uniqueness if email is being updated
    if (email) {
      const currentUser = await User.findById(userId);
      if (currentUser.email !== email) {
        const emailExists = await User.emailExists(email);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use'
          });
        }
      }
    }

    const updatedUser = await User.updateDetails(userId, {
      first_name,
      last_name,
      phone,
      about,
      profile_image,
      email
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Emit socket event for profile update
    const socketManager = require('../socket/socketManager');
    const io = socketManager.getIO();
    if (io) {
      io.emit('profile_updated', { userId });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Create new admin
// @route   POST /api/admin/admins
// @access  Private/Admin
exports.createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, username, password } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !username) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user exists
    const userExists = await User.emailExists(email);
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const usernameExists = await User.findByUsername(username);
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create user with admin role and active status
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      username,
      phone,
      role: 'admin',
      status: 'active',
      schoolId: req.user.school_id
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Admin created successfully'
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating admin'
    });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/password
// @access  Private/Admin
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.updatePassword(userId, hashedPassword);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password'
    });
  }
};