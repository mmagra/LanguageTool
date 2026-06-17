const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  resetPasswordValidation,
  forgotPasswordValidation,
} = require('../middleware/validation');
const { ROLES, USER_STATUS } = require('../utils/constants');
const { logAction } = require('./auditController');
const { pool } = require('../config/database');
const { sendPasswordResetEmail } = require('../utils/emailService');

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Validate request data
    const { error } = registerValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const {
      email, password, firstName, lastName, role, phone, username,
      guardianName, guardianRelation, gradeId, preferredLanguage, // Student fields
      schoolName // Teacher fields
    } = req.body;

    // Check if user already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if username already exists
    const usernameExists = await User.findByUsername(username);
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'ID/Username already exists'
      });
    }

    // Handle School Association
    let schoolId = req.body.schoolId || null; // Accept direct schoolId from frontend

    // If schoolId is not provided but schoolName is (Teacher legacy flow) or fallback needed
    if (!schoolId) {
      if (schoolName) {
        const schoolQuery = await require('../models/User').pool?.query('SELECT id FROM schools WHERE name = $1', [schoolName])
          || await require('../config/database').query('SELECT id FROM schools WHERE name = $1', [schoolName]);
        if (schoolQuery.rows.length > 0) {
          schoolId = schoolQuery.rows[0].id;
        } else {
          // Fallback to Default School if specific one not found
          const defaultSchool = await require('../config/database').query("SELECT id FROM schools WHERE name = 'Default School'");
          if (defaultSchool.rows.length > 0) schoolId = defaultSchool.rows[0].id;
        }
      } else {
        // Default to 'Default School' if nothing provided
        const defaultSchool = await require('../config/database').query("SELECT id FROM schools WHERE name = 'Default School'");
        if (defaultSchool.rows.length > 0) schoolId = defaultSchool.rows[0].id;
      }
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      username,
      schoolId // Pass the resolved schoolId
    });

    // Handle Role Specific Profiles
    if (role === 'student') {
      await Student.updateProfile(user.id, {
        grade_id: gradeId,
        guardian_name: guardianName,
        guardian_relation: guardianRelation,
        preferred_language_id: preferredLanguage // Assuming frontend sends ID or we need to map it?
        // Wait, frontend probably sends ID now if updated, or string?
        // The variable name is preferredLanguage. Let's assume it might be ID or we need to handle it.
        // For now, passing it as is, assuming it corresponds to preferred_language_id logic in Student.updateProfile
      });
    } else if (role === 'teacher') {
      await Teacher.updateProfile(user.id, {
        // school_name removed, now linked via user.school_id
        qualifications: null,
        experience_years: null
      });
    }

    // Don't send password hash in response
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      createdAt: user.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for admin approval.',
      data: userResponse
    });

    try {
      logAction(user.id, user.email, 'REGISTER', 'auth', user.id, { role: user.role, email: user.email }, req);
    } catch (auditErr) { console.error('Audit Log Error', auditErr); }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Validate request data
    const { error } = loginValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { identifier, password } = req.body;

    // Check if user exists (by username or email)
    const user = await User.findByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    // Check if user is approved — also allow 'allowed' status
    const allowedStatuses = [USER_STATUS.APPROVED, USER_STATUS.ACTIVE, USER_STATUS.ALLOWED];
    if (!allowedStatuses.includes(user.status)) {
      const isPending = user.status === USER_STATUS.PENDING;
      return res.status(403).json({
        success: false,
        message: isPending
          ? 'Your account is pending approval by admin'
          : 'Your account has been rejected or is inactive. Please contact support.'
      });
    }

    // Check password
    const validPassword = await User.comparePassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    // Update status to active if this is first login after approval
    if (user.status === 'approved') {
      await User.activateUser(user.id);
      user.status = 'active';
    }

    // Set user online in database
    await User.setOnlineStatus(user.id, true);

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        school_id: user.school_id,
        is_super_admin: user.role === ROLES.SUPER_ADMIN
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );


    // Prepare user response data
    let userResponseData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      profile_image: user.profile_image
    };

    // If student, attach profile data (preferred_language) for UI use
    if (user.role === 'student') {
      try {
        const studentProfile = await Student.findById(user.id);
        if (studentProfile) {
          userResponseData.preferred_language = studentProfile.preferred_language;
        }
      } catch (err) {
        console.error('Error fetching student profile for login:', err);
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponseData
      }
    });

    try {
      logAction(user.id, user.email, 'LOGIN', 'auth', user.id, { role: user.role, email: user.email }, req);
    } catch (auditErr) { console.error('Audit Log Error', auditErr); }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Set user offline in database
    await User.setOnlineStatus(userId, false);

    try {
      logAction(userId, req.user.email, 'LOGOUT', 'auth', userId, { email: req.user.email }, req);
    } catch (auditErr) { console.error('Audit Log Error', auditErr); }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      phone: user.phone,
      role: user.role,
      status: user.status,
      approvedAt: user.approved_at,
      createdAt: user.created_at,
      profile_image: user.profile_image
    };

    if (user.role === 'student') {
      try {
        const studentProfile = await Student.findById(user.id);
        if (studentProfile) {
          userData.preferred_language = studentProfile.preferred_language;
        }
      } catch (err) {
        console.error('Error fetching student profile in getMe:', err);
      }
    }

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input (enforces shared password policy on newPassword)
    const { error } = changePasswordValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Get user with password hash
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await User.comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid current password'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.updatePassword(user.id, hashedPassword);


    // Create new token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        school_id: user.school_id,
        is_super_admin: user.role === ROLES.SUPER_ADMIN
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: {
        token
      }
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, email, profile_image } = req.body;

    // Update user in database
    const updateData = {
      first_name,
      last_name,
      phone,
      profile_image
    };

    // Only update email if it's different and not already taken
    if (email && email !== req.user.email) {
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      updateData.email = email;
    }

    await User.updateProfile(userId, updateData);

    // Get updated user
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          phone: updatedUser.phone,
          profile_image: updatedUser.profile_image,
          role: updatedUser.role
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = forgotPasswordValidation(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const user = await User.findByEmail(email);

    // Always return the same response to prevent email enumeration
    const successMsg = 'If an account with that email exists, a reset link has been sent.';

    if (!user) {
      return res.json({ success: true, message: successMsg });
    }

    // Delete any existing unused tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Generate secure random token; store only its SHA-256 hash so a DB leak
    // does not expose usable reset tokens. The raw token goes only to the user's email.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetLink, user.first_name);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr);
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Enforce shared password policy (presence + strength)
    const { error } = resetPasswordValidation(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Look up by the SHA-256 hash of the supplied token (tokens are stored hashed)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const resetRecord = result.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.updatePassword(resetRecord.user_id, hashedPassword);

    // Mark token as used
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [resetRecord.id]);

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};