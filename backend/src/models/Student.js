const db = require('../config/database');

class Student {
    // Get all students with profiles
    static async getAll(schoolId = null) {
        let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.username, u.phone, 
        u.profile_image, u.about, u.status, u.is_online, u.created_at,
        sp.grade_id, sp.guardian_name, sp.guardian_relation, 
        sp.preferred_language_id, -- Updated
        s.name as school_name, -- From schools table
        u.school_id, -- Added for frontend filtering
        l.name as preferred_language, -- Joined language name
        (SELECT json_agg(sl.language_id) FROM school_languages sl WHERE sl.school_id = u.school_id) as allowed_languages, -- Subquery for allowed langs
        g.name as grade_name
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN languages l ON sp.preferred_language_id = l.id
      LEFT JOIN grades g ON sp.grade_id = g.id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.role = 'student'
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
            throw new Error(`Error fetching students: ${error.message}`);
        }
    }

    // Get student by ID
    static async findById(id) {
        const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.username, u.phone, 
        u.profile_image, u.about, u.status, u.is_online, u.created_at,
        sp.id as profile_id, sp.grade_id, sp.guardian_name, sp.guardian_relation, 
        sp.preferred_language_id, -- Updated
        s.name as school_name, -- From schools table
        u.school_id, -- Added for frontend filtering
        (SELECT json_agg(sl.language_id) FROM school_languages sl WHERE sl.school_id = u.school_id) as allowed_languages, -- Subquery for allowed langs
        g.name as grade_name,
        l.name as preferred_language -- Joined language name
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN languages l ON sp.preferred_language_id = l.id
      LEFT JOIN grades g ON sp.grade_id = g.id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.id = $1 AND u.role = 'student'
    `;

        try {
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error finding student: ${error.message}`);
        }
    }

    // Update student profile
    static async updateProfile(userId, profileData) {
        const { grade_id, guardian_name, guardian_relation, preferred_language_id } = profileData;

        // Check if profile exists
        const checkQuery = 'SELECT id FROM student_profiles WHERE user_id = $1';
        const checkResult = await db.query(checkQuery, [userId]);

        if (checkResult.rows.length === 0) {
            // Create profile
            const insertQuery = `
        INSERT INTO student_profiles (user_id, grade_id, guardian_name, guardian_relation, preferred_language_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
            const result = await db.query(insertQuery, [userId, grade_id, guardian_name, guardian_relation, preferred_language_id]);
            return result.rows[0];
        } else {
            // Update profile
            const updateQuery = `
        UPDATE student_profiles
        SET grade_id = COALESCE($2, grade_id),
            guardian_name = COALESCE($3, guardian_name),
            guardian_relation = COALESCE($4, guardian_relation),
            preferred_language_id = COALESCE($5, preferred_language_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;
            const result = await db.query(updateQuery, [userId, grade_id, guardian_name, guardian_relation, preferred_language_id]);
            return result.rows[0];
        }
    }

    // Get students by grade
    static async getByGrade(gradeId, schoolId = null) {
        let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.username, u.phone, u.status, u.profile_image as profile_image,
        sp.guardian_name, l.name as preferred_language,
        g.name as grade_name
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN languages l ON sp.preferred_language_id = l.id
      JOIN grades g ON sp.grade_id = g.id
      WHERE sp.grade_id = $1 AND u.role = 'student'
    `;

        const params = [gradeId];
        if (schoolId) {
            query += " AND u.school_id = $2";
            params.push(schoolId);
        }

        query += ` ORDER BY u.last_name, u.first_name`;

        try {
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching students by grade: ${error.message}`);
        }
    }

    // Update grades for multiple students
    static async updateGradesBulk(studentIds, newGradeId) {
        const query = `
            UPDATE student_profiles
            SET grade_id = $2, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ANY($1::int[])
            RETURNING *
        `;

        try {
            const result = await db.query(query, [studentIds, newGradeId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error updating student grades: ${error.message}`);
        }
    }

    // Get student count
    static async getCount(schoolId = null) {
        let query = "SELECT COUNT(*) FROM users WHERE role = 'student' AND status NOT IN ('pending', 'rejected')";
        const params = [];
        if (schoolId) {
            query += " AND school_id = $1";
            params.push(schoolId);
        }
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count);
    }
}

module.exports = Student;
