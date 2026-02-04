const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { registerValidation, loginValidation } = require('../middleware/validation');

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

    // Check if user is approved
    if (user.status !== 'approved' && user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval by admin'
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
    console.log(`User ${user.email} set to online in database`);

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        school_id: user.school_id
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    console.log('Generated token for user:', user.email);
    console.log('Token expires in:', config.jwt.expire);

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
    console.log(`User ${req.user.email} set to offline in database`);

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

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
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
    const salt = await require('bcryptjs').genSalt(10);
    const hashedPassword = await require('bcryptjs').hash(newPassword, salt);

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
        school_id: user.school_id
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