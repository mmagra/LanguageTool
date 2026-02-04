const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// @desc    Get all users (Super Admin only, supports filtering by school and role)
// @route   GET /api/super-admin/users
// @access  Super Admin
exports.getAllUsers = async (req, res) => {
    const { school_id, role, search } = req.query;

    try {
        let query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.status, u.school_id, u.created_at,
                   s.name as school_name
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (school_id) {
            query += ` AND u.school_id = $${paramCount}`;
            values.push(school_id);
            paramCount++;
        }

        if (role) {
            query += ` AND u.role = $${paramCount}`;
            values.push(role);
            paramCount++;
        }

        if (search) {
            query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
            values.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY u.created_at DESC LIMIT 100`;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a new user (School Admin, Teacher, Student)
// @route   POST /api/super-admin/users
// @access  Super Admin
exports.createUser = async (req, res) => {
    const {
        email,
        password,
        first_name,
        last_name,
        role,
        school_id,
        preferred_language = 'English'
    } = req.body;

    if (!email || !password || !first_name || !last_name || !role) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Role validation
    const validRoles = ['admin', 'teacher', 'student'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (role !== 'super_admin' && !school_id) {
        return res.status(400).json({ success: false, message: 'School ID is required for non-super-admin users' });
    }

    try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO users (
                email, password_hash, first_name, last_name, role, school_id, preferred_language, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') 
            RETURNING id, email, first_name, last_name, role, school_id`,
            [email, hashedPassword, first_name, last_name, role, school_id, preferred_language]
        );

        // If it's a student, checking/creating profile (simplified for now)
        if (role === 'student') {
            // Fetch language ID if dynamic
            // For now, minimal student profile creation if needed
            // await pool.query('INSERT INTO student_profiles ...')
            // Leaving this for the specific student creation flow if needed, 
            // but Super Admin usually creates School Admins.
        }

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Error creating user:', err);
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user
// @route   PUT /api/super-admin/users/:id
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, role, school_id, status } = req.body;

    try {
        // Build dynamic update query
        // For simplicity reusing strict update for now
        const result = await pool.query(
            `UPDATE users 
             SET first_name = $1, last_name = $2, email = $3, role = $4, school_id = $5, status = $6, updated_at = NOW()
             WHERE id = $7
             RETURNING id, email, first_name, last_name, role, school_id, status`,
            [first_name, last_name, email, role, school_id, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Check if user email or username exists
// @route   POST /api/super-admin/users/check-availability
// @access  Super Admin
exports.checkUserAvailability = async (req, res) => {
    const { email, username } = req.body;
    try {
        let exists = false;
        let message = '';

        if (email) {
            const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (result.rows.length > 0) {
                exists = true;
                message = 'A user with this email already exists';
            }
        }

        if (!exists && username) {
            const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                exists = true;
                message = 'Username already taken';
            }
        }

        res.json({ success: true, exists, message });
    } catch (err) {
        console.error('Error checking user availability:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
