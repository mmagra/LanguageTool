const db = require('../config/database');

class Teacher {
    // Get all teachers with profiles
    static async getAll(schoolId = null) {
        let query = `
      SELECT 
        u.id, u.email, u.username, u.first_name, u.last_name, u.phone, 
        u.profile_image, u.about, u.status, u.is_online, u.created_at,
        s.name as school_name -- From schools table
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.role = 'teacher'
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
            throw new Error(`Error fetching teachers: ${error.message}`);
        }
    }

    // Get teacher by ID
    static async findById(id) {
        const query = `
      SELECT 
        u.id, u.email, u.username, u.first_name, u.last_name, u.phone, 
        u.profile_image, u.about, u.status, u.is_online, u.created_at,
        u.school_id,
        tp.id as profile_id,
        s.name as school_name -- From schools table
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.id = $1 AND u.role = 'teacher'
    `;

        try {
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error finding teacher: ${error.message}`);
        }
    }

    // Update teacher profile
    static async updateProfile(userId, profileData) {
        // Since most fields are removed, currently this just creates an empty profile if needed
        // or effectively does nothing if no fields are left to update in this table.
        // We'll keep it for future scalability.

        // Check if profile exists
        const checkQuery = 'SELECT id FROM teacher_profiles WHERE user_id = $1';
        const checkResult = await db.query(checkQuery, [userId]);

        if (checkResult.rows.length === 0) {
            // Create profile
            const insertQuery = `
        INSERT INTO teacher_profiles (user_id)
        VALUES ($1)
        RETURNING *
      `;
            const result = await db.query(insertQuery, [userId]);
            return result.rows[0];
        } else {
            // Nothing to update in teacher_profiles currently as all fields were removed
            // Just return existing profile
            return checkResult.rows[0];
        }
    }

    // Get teacher count
    static async getCount(schoolId = null) {
        let query = "SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status NOT IN ('pending', 'rejected')";
        const params = [];
        if (schoolId) {
            query += " AND school_id = $1";
            params.push(schoolId);
        }
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count);
    }
}

module.exports = Teacher;
