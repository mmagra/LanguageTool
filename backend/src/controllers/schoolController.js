const { pool } = require('../config/database');

// @desc    Get all schools
// @route   GET /api/super-admin/schools
// @access  Super Admin
exports.getAllSchools = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*,
            (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'student' AND u.status NOT IN ('pending', 'rejected'))::int as student_count,
            (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher' AND u.status NOT IN ('pending', 'rejected'))::int as teacher_count
            FROM schools s
            ORDER BY s.created_at DESC
        `);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching schools:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single school by ID
// @route   GET /api/super-admin/schools/:id
// @access  Super Admin
exports.getSchoolById = async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch basic school info
        const schoolResult = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);

        if (schoolResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const school = schoolResult.rows[0];

        // Fetch allowed languages
        const languagesResult = await pool.query(`
            SELECT l.id, l.name, l.code
            FROM school_languages sl
            JOIN languages l ON sl.language_id = l.id
            WHERE sl.school_id = $1
        `, [id]);

        // Fetch usage stats (active users only)
        const studentCountResult = await pool.query(
            "SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'student' AND status NOT IN ('pending', 'rejected')",
            [id]
        );
        const teacherCountResult = await pool.query(
            "SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'teacher' AND status NOT IN ('pending', 'rejected')",
            [id]
        );

        // Add extra data to school object
        const schoolData = {
            ...school,
            allowed_languages: languagesResult.rows,
            stats: {
                students: parseInt(studentCountResult.rows[0].count),
                teachers: parseInt(teacherCountResult.rows[0].count)
            }
        };

        res.json({
            success: true,
            data: schoolData
        });
    } catch (err) {
        console.error('Error fetching school:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new school
// @route   POST /api/super-admin/schools
// @access  Super Admin
// @desc    Create new school
// @route   POST /api/super-admin/schools
// @access  Super Admin
exports.createSchool = async (req, res) => {
    const {
        name,
        contact_email,
        contact_number, // New
        plan_tier = 'basic',
        max_students = 100,
        max_teachers = 10,
        minutes_limit = 1000, // New
        valid_until, // New
        allowed_languages,
        admin_first_name,
        admin_last_name,
        admin_email,
        admin_phone, // New
        admin_username, // New
        admin_password
    } = req.body;

    if (!name || !admin_email || !admin_password || !admin_first_name) {
        return res.status(400).json({ success: false, message: 'School name and initial admin details are required' });
    }

    try {
        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Check if admin email already exists (fail fast)
            const userCheck = await client.query('SELECT id FROM users WHERE email = $1 OR username = $2', [admin_email, admin_username || admin_email]);
            if (userCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Admin email or username already exists' });
            }

            // 2. Create School
            const schoolResult = await client.query(
                `INSERT INTO schools (
                    name, contact_email, contact_number, plan_tier, max_students, max_teachers, minutes_limit, valid_until,
                    status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW()) 
                RETURNING *`,
                [
                    name,
                    contact_email,
                    contact_number,
                    plan_tier,
                    max_students,
                    max_teachers,
                    minutes_limit,
                    valid_until || null
                ]
            );

            const school = schoolResult.rows[0];
            const schoolId = school.id;

            // 2b. Handle School Languages
            if (allowed_languages && allowed_languages.length > 0) {
                // Get language IDs
                const langResult = await client.query(
                    'SELECT id FROM languages WHERE code = ANY($1)',
                    [allowed_languages]
                );

                // Check invalid languages? Optional, but good practice.

                // Insert into school_languages
                if (langResult.rows.length > 0) {
                    const langValues = langResult.rows.map(row => `(${schoolId}, ${row.id})`).join(',');
                    await client.query(
                        `INSERT INTO school_languages (school_id, language_id) VALUES ${langValues} ON CONFLICT DO NOTHING`
                    );
                }
            }

            // 3. Create Admin User
            // Hash password
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(admin_password, salt);

            // Use provided username or fallback to email
            const finalUsername = admin_username || admin_email;

            await client.query(
                `INSERT INTO users (
                   first_name, last_name, email, phone, username, password_hash, role, 
                   school_id, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'admin', $7, 'active', NOW(), NOW())
                RETURNING id`,
                [
                    admin_first_name,
                    admin_last_name,
                    admin_email,
                    admin_phone,
                    finalUsername,
                    hashedPassword,
                    schoolId
                ]
            );

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'School and Admin created successfully',
                data: school
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error creating school:', err);
        if (err.code === '23505') {
            // Check constraint name if possible, or generic message
            if (err.detail && err.detail.includes('name')) {
                return res.status(400).json({ success: false, message: 'School name already exists' });
            }
            if (err.detail && err.detail.includes('email')) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
            return res.status(400).json({ success: false, message: 'Duplicate entry detected' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update school
// @route   PUT /api/super-admin/schools/:id
// @access  Super Admin
exports.updateSchool = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        contact_email,
        plan_tier,
        max_students,
        max_teachers,
        allowed_languages,
        status
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE schools 
             SET name = $1, contact_email = $2, plan_tier = $3, 
                 max_students = $4, max_teachers = $5,
                 status = $6, updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
            [
                name, contact_email, plan_tier, max_students, max_teachers,
                status, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // Handle Allowed Languages Update (Replace all)
        if (allowed_languages && Array.isArray(allowed_languages)) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 1. Remove existing
                await client.query('DELETE FROM school_languages WHERE school_id = $1', [id]);

                // 2. Insert new
                if (allowed_languages.length > 0) {
                    const langResult = await client.query(
                        'SELECT id FROM languages WHERE code = ANY($1)',
                        [allowed_languages]
                    );

                    if (langResult.rows.length > 0) {
                        const langValues = langResult.rows.map(row => `(${id}, ${row.id})`).join(',');
                        await client.query(
                            `INSERT INTO school_languages (school_id, language_id) VALUES ${langValues}`
                        );
                    }
                }

                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('Error updating school languages:', err);
                // Don't fail the whole request, but log it
            } finally {
                client.release();
            }
        }

        res.json({
            success: true,
            message: 'School updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating school:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update School Logo
// @route   POST /api/super-admin/schools/:id/logo
// @access  Super Admin
// simplify: user sends a URL (assuming upload handled elsewhere or just URL input for now)
exports.updateSchoolLogo = async (req, res) => {
    const { id } = req.params;
    const { logo_url } = req.body;

    try {
        const result = await pool.query(
            `UPDATE schools SET logo_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [logo_url, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        res.json({
            success: true,
            message: 'School logo updated',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating logo:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get admins for a school
// @route   GET /api/super-admin/schools/:id/admins
// @access  Super Admin
exports.getSchoolAdmins = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT id, first_name, last_name, email, username, phone, status, created_at
            FROM users
            WHERE school_id = $1 AND role = 'admin'
            ORDER BY created_at DESC
        `, [id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching school admins:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// @desc    Get current admin's school
// @route   GET /api/admin/school
// @access  Admin (School Admin)
exports.getMySchool = async (req, res) => {
    try {
        const schoolId = req.user.school_id;
        if (!schoolId) {
            return res.status(404).json({ success: false, message: 'No school associated with this admin' });
        }

        const result = await pool.query('SELECT * FROM schools WHERE id = $1', [schoolId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const schoolData = result.rows[0];

        // Get Stats: Student Count
        const studentsResult = await pool.query(
            `SELECT COUNT(*) FROM student_profiles sp
             JOIN users u ON sp.user_id = u.id
             WHERE u.school_id = $1 AND u.status NOT IN ('pending', 'rejected')`,
            [schoolId]
        );

        // Get Stats: Teacher Count
        const teachersResult = await pool.query(
            `SELECT COUNT(*) FROM teacher_profiles tp
             JOIN users u ON tp.user_id = u.id
             WHERE u.school_id = $1 AND u.status NOT IN ('pending', 'rejected')`,
            [schoolId]
        );

        // Get Allowed Languages (Normalized)
        const languagesResult = await pool.query(
            `SELECT l.id, l.name, l.code
             FROM school_languages sl
             JOIN languages l ON sl.language_id = l.id
             WHERE sl.school_id = $1`,
            [schoolId]
        );

        schoolData.allowed_languages = languagesResult.rows;

        // Attach stats to response
        schoolData.student_count = parseInt(studentsResult.rows[0].count);
        schoolData.teacher_count = parseInt(teachersResult.rows[0].count);

        // Ensure stats fields exist (backwards compatibility)
        schoolData.minutes_used = schoolData.minutes_used || 0;
        schoolData.minutes_limit = schoolData.minutes_limit || 1000;

        res.json({
            success: true,
            data: schoolData
        });
    } catch (err) {
        console.error('Error fetching my school:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update current admin's school details
// @route   PUT /api/admin/school
// @access  Admin (School Admin)
exports.updateMySchool = async (req, res) => {
    try {
        const schoolId = req.user.school_id;
        if (!schoolId) {
            return res.status(404).json({ success: false, message: 'No school associated with this admin' });
        }

        const {
            name,
            contact_email,
            contact_number,
            logo_url
        } = req.body;

        // School Admins can only update specific fields (NOT plan_tier, limits, etc.)
        const result = await pool.query(
            `UPDATE schools 
             SET name = COALESCE($1, name), 
                 contact_email = COALESCE($2, contact_email), 
                 contact_number = COALESCE($3, contact_number),
                 logo_url = COALESCE($4, logo_url),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [name, contact_email, contact_number, logo_url, schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        res.json({
            success: true,
            message: 'School details updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating my school:', err);
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'School name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// @desc    Get allowed languages for current user's school
// @route   GET /api/my-school/languages
// @access  Protected (Student/Teacher/Admin)
exports.getMySchoolLanguages = async (req, res) => {
    try {
        const schoolId = req.user.school_id;
        if (!schoolId) {
            // Fallback for users without school (e.g. Super Admin)
            if (req.user.role === 'super_admin') {
                const result = await pool.query('SELECT * FROM languages WHERE is_active = true ORDER BY name ASC');
                return res.json({ success: true, data: result.rows });
            }
            return res.status(404).json({ success: false, message: 'No school assigned' });
        }

        const result = await pool.query(
            `SELECT l.* 
             FROM school_languages sl
             JOIN languages l ON sl.language_id = l.id
             WHERE sl.school_id = $1 AND l.is_active = true
             ORDER BY l.name ASC`,
            [schoolId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching school languages:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all public schools (for registration)
// @route   GET /api/public/schools
// @access  Public
exports.getPublicSchools = async (req, res) => {
    try {
        const query = `
            SELECT s.id, s.name, s.logo_url,
                   COALESCE(
                       json_agg(json_build_object('id', l.id, 'name', l.name, 'code', l.code)) 
                       FILTER (WHERE l.id IS NOT NULL), 
                       '[]'
                   ) as allowed_languages
            FROM schools s
            LEFT JOIN school_languages sl ON s.id = sl.school_id
            LEFT JOIN languages l ON sl.language_id = l.id
            WHERE s.status = $1
            GROUP BY s.id
            ORDER BY s.name ASC
        `;

        const result = await pool.query(query, ['active']);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching public schools:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get school usage statistics
// @route   GET /api/super-admin/schools/:id/usage-stats
// @access  Super Admin
exports.getSchoolUsageStats = async (req, res) => {
    const { id } = req.params;

    try {
        // Get school data
        const schoolResult = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);

        if (schoolResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const school = schoolResult.rows[0];

        // Get student count
        const studentCount = await pool.query(
            "SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'student' AND status NOT IN ('pending', 'rejected')",
            [id]
        );

        // Get teacher count
        const teacherCount = await pool.query(
            "SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'teacher' AND status NOT IN ('pending', 'rejected')",
            [id]
        );

        // Calculate days until expiry
        let daysUntilExpiry = null;
        if (school.valid_until) {
            const expiryDate = new Date(school.valid_until);
            const today = new Date();
            const diffTime = expiryDate - today;
            daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Calculate usage percentages
        const minutesPercentage = school.minutes_limit > 0
            ? ((school.minutes_used / school.minutes_limit) * 100).toFixed(1)
            : 0;

        const studentsPercentage = school.max_students > 0
            ? ((parseInt(studentCount.rows[0].count) / school.max_students) * 100).toFixed(1)
            : 0;

        const teachersPercentage = school.max_teachers > 0
            ? ((parseInt(teacherCount.rows[0].count) / school.max_teachers) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                minutes_used: school.minutes_used,
                minutes_limit: school.minutes_limit,
                minutes_percentage: parseFloat(minutesPercentage),
                minutes_remaining: school.minutes_limit - school.minutes_used,
                student_count: parseInt(studentCount.rows[0].count),
                max_students: school.max_students,
                students_percentage: parseFloat(studentsPercentage),
                teacher_count: parseInt(teacherCount.rows[0].count),
                max_teachers: school.max_teachers,
                teachers_percentage: parseFloat(teachersPercentage),
                valid_until: school.valid_until,
                days_until_expiry: daysUntilExpiry
            }
        });
    } catch (err) {
        console.error('Error fetching usage stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// @desc    Check if school email or name exists
// @route   POST /api/super-admin/schools/check-availability
// @access  Super Admin
exports.checkSchoolAvailability = async (req, res) => {
    const { email, name } = req.body;
    try {
        let exists = false;
        let message = '';

        if (email) {
            const result = await pool.query('SELECT id FROM schools WHERE contact_email = $1', [email]);
            if (result.rows.length > 0) {
                exists = true;
                message = 'School with this email already exists';
            }
        }

        if (!exists && name) {
            const result = await pool.query('SELECT id FROM schools WHERE name = $1', [name]);
            if (result.rows.length > 0) {
                exists = true;
                message = 'School name already exists';
            }
        }

        res.json({ success: true, exists, message });
    } catch (err) {
        console.error('Error checking availability:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
