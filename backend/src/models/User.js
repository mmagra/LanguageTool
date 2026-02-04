const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create({ email, password, firstName, lastName, role = 'student', status = 'pending', username, phone, schoolId }) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, status, username, phone, school_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name, role, status, username, phone, created_at, school_id
    `;

    const values = [email, passwordHash, firstName, lastName, role, status, username, phone, schoolId];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }


  // Find user by email
  static async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, username,
             phone, profile_image, about, role, status, is_online,
             approved_by, approved_at, created_at, school_id
      FROM users
      WHERE email = $1
    `;

    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, username, phone, 
             profile_image, about, role, status, is_online,
             approved_by, approved_at, created_at, school_id
      FROM users
      WHERE id = $1
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find user by username
  static async findByUsername(username) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, username,
             phone, profile_image, about, role, status, is_online,
             approved_by, approved_at, created_at
      FROM users
      WHERE username = $1
    `;

    try {
      const result = await db.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find user by username OR email
  static async findByUsernameOrEmail(identifier) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, username,
             phone, profile_image, about, role, status, is_online,
             approved_by, approved_at, created_at, school_id
      FROM users
      WHERE username = $1 OR email = $1
    `;

    try {
      const result = await db.query(query, [identifier]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Get all pending users
  static async getPendingUsers(schoolId = null) {
    let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.username, u.phone, u.profile_image,
        sp.grade_id, sp.preferred_language_id, sp.guardian_name, sp.guardian_relation,
        s.name as school_name
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.status = 'pending'
    `;

    const params = [];
    if (schoolId) {
      query += ` AND u.school_id = $1`;
      params.push(schoolId);
    }

    query += ` ORDER BY u.created_at DESC`;

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting pending users: ${error.message}`);
    }
  }
  // Get all denied users
  static async getDeniedUsers(schoolId = null) {
    let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.username, u.phone, u.profile_image,
        u.approved_at as denied_at,
        sp.grade_id, sp.preferred_language_id, sp.guardian_name, sp.guardian_relation,
        s.name as school_name
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.status = 'rejected'
    `;

    const params = [];
    if (schoolId) {
      query += ` AND u.school_id = $1`;
      params.push(schoolId);
    }

    query += ` ORDER BY u.approved_at DESC`;

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting denied users: ${error.message}`);
    }
  }

  // Approve user
  static async approveUser(userId, adminId) {
    const query = `
      UPDATE users
      SET status = 'approved',
          approved_by = $2,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING id, email, first_name, last_name, role, status, approved_at
    `;

    try {
      const result = await db.query(query, [userId, adminId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error approving user: ${error.message}`);
    }
  }

  // Reject user
  static async rejectUser(userId, adminId) {
    const query = `
      UPDATE users
      SET status = 'rejected',
          approved_by = $2,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING id, email, first_name, last_name, role, status
    `;

    try {
      const result = await db.query(query, [userId, adminId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error rejecting user: ${error.message}`);
    }
  }

  // Get all users (for admin)
  static async getAllUsers(schoolId = null) {
    let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.status,
        u.approved_at, u.created_at,
        a.email as approved_by_email
      FROM users u
      LEFT JOIN users a ON u.approved_by = a.id
    `;

    const params = [];
    if (schoolId) {
      query += ` WHERE u.school_id = $1`;
      params.push(schoolId);
    }

    query += ` ORDER BY u.created_at DESC`;

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting all users: ${error.message}`);
    }
  }

  // Get all admins
  static async getAdmins(schoolId = null) {
    let query = `
      SELECT id, email, first_name, last_name, username, phone, 
             role, status, created_at, profile_image
      FROM users
      WHERE role = 'admin'
    `;

    const params = [];
    if (schoolId) {
      query += ` AND school_id = $1`;
      params.push(schoolId);
    }

    query += ` ORDER BY created_at DESC`;

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting admins: ${error.message}`);
    }
  }

  // Check if email exists
  static async emailExists(email) {
    const query = 'SELECT COUNT(*) FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return parseInt(result.rows[0].count) > 0;
  }

  // Update user status to active (after first login)
  static async activateUser(userId) {
    const query = `
      UPDATE users
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'approved'
      RETURNING id, email, first_name, last_name, role, status
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error activating user: ${error.message}`);
    }
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Update password
  static async updatePassword(id, hashedPassword) {
    const query = `
      UPDATE users 
      SET password_hash = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING id
    `;
    try {
      const result = await db.query(query, [id, hashedPassword]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  // Update user profile
  static async updateProfile(id, profileData) {
    const { first_name, last_name, phone, email, profile_image } = profileData;

    const query = `
      UPDATE users 
      SET 
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        profile_image = COALESCE($6, profile_image),
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING id, email, first_name, last_name, phone, profile_image
    `;

    try {
      const result = await db.query(query, [
        id,
        first_name,
        last_name,
        phone,
        email,
        profile_image
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating profile: ${error.message}`);
    }
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Set online status
  static async setOnlineStatus(userId, isOnline) {
    const query = `
      UPDATE users
      SET is_online = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, is_online
    `;

    try {
      const result = await db.query(query, [userId, isOnline]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating online status: ${error.message}`);
    }
  }
  // Check if username exists
  static async usernameExists(username) {
    const query = 'SELECT COUNT(*) FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return parseInt(result.rows[0].count) > 0;
  }

  // Update user details
  static async updateDetails(id, data) {
    const { first_name, last_name, phone, about, profile_image, email, username } = data;

    // Convert empty string to null for profile_image
    const imageValue = profile_image === '' ? null : profile_image;

    const query = `
    UPDATE users 
    SET first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone),
        about = COALESCE($5, about),
        profile_image = $6,
        email = COALESCE($7, email),
        username = COALESCE($8, username),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, first_name, last_name, phone, about, profile_image, role, status, username
  `;

    try {
      const result = await db.query(query, [id, first_name, last_name, phone, about, imageValue, email, username]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating user details: ${error.message}`);
    }
  }
}

module.exports = User;