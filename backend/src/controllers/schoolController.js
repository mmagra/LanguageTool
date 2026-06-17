const { pool } = require('../config/database');
const { logAction } = require('./auditController');
const { createSchoolValidation } = require('../middleware/validation');
const { snapshotAndResetUsage } = require('./paymentController');

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
        street_address = null, // USA address
        city = null,
        state = null,
        zip_code = null,
        plan_tier = 'basic',
        max_students = 100,
        max_teachers = 10,
        minutes_limit = 1000, // New
        translation_chars_limit = 500000, // monthly translation allowance
        tts_chars_limit = 250000,         // monthly voice allowance
        valid_until, // New
        monthly_price = null, // recurring Stripe price
        allowed_languages,
        premium_translation = false, // Per-school paid Google Translate
        premium_tts = false,         // Per-school paid Google Text-to-Speech
        admin_first_name,
        admin_last_name,
        admin_email,
        admin_phone, // New
        admin_username, // New
        admin_password
    } = req.body;

    // Shared validation: email format, password strength, names, phone
    const { error } = createSchoolValidation(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
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

            // Build the features object: keep existing defaults, layer in the premium flags
            const features = {
                in_person: true,
                chat_history: true,
                remote_sessions: false,
                premium_translation: premium_translation === true,
                premium_tts: premium_tts === true
            };

            // 2. Create School
            const schoolResult = await client.query(
                `INSERT INTO schools (
                    name, contact_email, contact_number, street_address, city, state, zip_code,
                    plan_tier, max_students, max_teachers, minutes_limit,
                    translation_chars_limit, tts_chars_limit, valid_until,
                    features, monthly_price, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active', NOW(), NOW())
                RETURNING *`,
                [
                    name,
                    contact_email,
                    contact_number,
                    street_address || null,
                    city || null,
                    state || null,
                    zip_code || null,
                    plan_tier,
                    max_students,
                    max_teachers,
                    minutes_limit,
                    translation_chars_limit,
                    tts_chars_limit,
                    valid_until || null,
                    JSON.stringify(features),
                    monthly_price
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
                    const placeholders = langResult.rows.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
                    const flatValues = langResult.rows.flatMap(row => [schoolId, row.id]);
                    await client.query(
                        `INSERT INTO school_languages (school_id, language_id) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
                        flatValues
                    );
                }
            }

            // Always guarantee English access so the student registration language
            // dropdown is never empty (otherwise students register with no language).
            await client.query(
                `INSERT INTO school_languages (school_id, language_id)
                 SELECT $1, id FROM languages WHERE code = 'en' ORDER BY id LIMIT 1
                 ON CONFLICT DO NOTHING`,
                [schoolId]
            );

            // 3. Create Admin User
            // Hash password
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(admin_password, salt);

            // Use provided username or fallback to email
            const finalUsername = admin_username || admin_email;

            const adminInsert = await client.query(
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

            // Welcome email with a secure "set your password" link (non-fatal).
            try {
                const crypto = require('crypto');
                const { sendEmail } = require('../utils/emailService');
                const adminId = adminInsert.rows[0].id;
                const token = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

                await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [adminId]);
                await pool.query(
                    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                    [adminId, token, expiresAt]
                );

                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const setPasswordLink = `${frontendUrl}/reset-password?token=${token}`;
                const loginLink = `${frontendUrl}/login`;

                await sendEmail({
                    to: admin_email,
                    subject: `Welcome to ${name} — set up your admin account`,
                    html: `
                        <h2>Your school admin account is ready</h2>
                        <p>Hi ${admin_first_name},</p>
                        <p>An administrator account has been created for <strong>${name}</strong>.</p>
                        <p><strong>Username:</strong> ${finalUsername}</p>
                        <p>For security, please set your own password using the button below (link valid for 7 days):</p>
                        <p><a href="${setPasswordLink}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Set your password</a></p>
                        <p>Then sign in at <a href="${loginLink}">${loginLink}</a>.</p>
                        <p style="color:#6b7280;font-size:13px;">Note: your school's features unlock once the subscription payment is completed.</p>
                    `
                });
            } catch (mailErr) {
                console.error('Failed to send admin welcome email:', mailErr.message);
                // Non-fatal: the school + admin were created successfully.
            }

            try {
                logAction(req.user.id, req.user.email, 'CREATE_SCHOOL', 'school', schoolId, { name }, req);
            } catch (e) { console.error('Audit log error', e); }

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
        contact_number,
        street_address,
        city,
        state,
        zip_code,
        plan_tier,
        max_students,
        max_teachers,
        minutes_limit,
        translation_chars_limit,
        tts_chars_limit,
        allowed_languages,
        status,
        premium_translation,
        premium_tts,
        monthly_price
    } = req.body;

    // Merge only the premium flags that were explicitly provided into the features JSONB
    const featuresPatch = {};
    if (premium_translation !== undefined) featuresPatch.premium_translation = premium_translation === true;
    if (premium_tts !== undefined) featuresPatch.premium_tts = premium_tts === true;

    try {
        const result = await pool.query(
            `UPDATE schools
             SET name = COALESCE($1, name), contact_email = COALESCE($2, contact_email), plan_tier = COALESCE($3, plan_tier),
                 max_students = COALESCE($4, max_students), max_teachers = COALESCE($5, max_teachers),
                 minutes_limit = COALESCE($7, minutes_limit),
                 translation_chars_limit = COALESCE($8, translation_chars_limit),
                 tts_chars_limit = COALESCE($9, tts_chars_limit),
                 status = COALESCE($6, status),
                 features = COALESCE(features, '{}'::jsonb) || $10::jsonb,
                 monthly_price = COALESCE($12, monthly_price),
                 contact_number = COALESCE($13, contact_number),
                 street_address = COALESCE($14, street_address),
                 city = COALESCE($15, city),
                 state = COALESCE($16, state),
                 zip_code = COALESCE($17, zip_code),
                 updated_at = NOW()
             WHERE id = $11
             RETURNING *`,
            [
                name, contact_email, plan_tier, max_students, max_teachers,
                status,
                minutes_limit ?? null,
                translation_chars_limit ?? null,
                tts_chars_limit ?? null,
                JSON.stringify(featuresPatch), id,
                monthly_price ?? null,
                contact_number ?? null,
                street_address ?? null,
                city ?? null,
                state ?? null,
                zip_code ?? null
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
                        const placeholders = langResult.rows.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
                        const flatValues = langResult.rows.flatMap(row => [id, row.id]);
                        await client.query(
                            `INSERT INTO school_languages (school_id, language_id) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
                            flatValues
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

        try {
            logAction(req.user.id, req.user.email, 'UPDATE_SCHOOL', 'school', id, { name, status, ...featuresPatch }, req);
        } catch (e) { console.error('Audit log error', e); }

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

// @desc    Grant/revoke free access or a no-payment trial for a school
// @route   POST /api/super-admin/schools/:id/access
// @access  Super Admin
// body: { mode: 'trial' | 'free' | 'revoke', days?: number }
exports.grantAccess = async (req, res) => {
    const { id } = req.params;
    const { mode, days } = req.body;

    try {
        if (mode === 'free') {
            // Snapshot the current period before granting free access.
            await snapshotAndResetUsage(id, 'free');
            await pool.query(
                `UPDATE schools
                 SET free_access = true,
                     subscription_status = CASE WHEN subscription_status = 'active' THEN subscription_status ELSE 'trialing' END
                 WHERE id = $1`,
                [id]
            );
        } else if (mode === 'trial') {
            const d = parseInt(days, 10);
            if (!d || d <= 0) {
                return res.status(400).json({ success: false, message: 'Enter a valid number of trial days.' });
            }
            // Snapshot current period before starting the new trial.
            await snapshotAndResetUsage(id, 'trial');
            await pool.query(
                `UPDATE schools
                 SET valid_until = NOW() + ($2::int * INTERVAL '1 day'),
                     subscription_status = 'trialing'
                 WHERE id = $1`,
                [id, d]
            );
        } else if (mode === 'revoke') {
            // Archive usage consumed during the comp/trial period before ending it.
            await snapshotAndResetUsage(id, 'free');
            // Turn off comp; if there's no active paid subscription, return to "pending payment".
            await pool.query('UPDATE schools SET free_access = false WHERE id = $1', [id]);
            await pool.query(
                `UPDATE schools
                 SET valid_until = NULL, subscription_status = 'none'
                 WHERE id = $1 AND (subscription_status <> 'active' OR subscription_status IS NULL)`,
                [id]
            );
        } else {
            return res.status(400).json({ success: false, message: 'Invalid access mode.' });
        }

        try {
            logAction(req.user.id, req.user.email, 'GRANT_SCHOOL_ACCESS', 'school', id, { mode, days }, req);
        } catch (e) { console.error('Audit log error', e); }

        const updated = await pool.query(
            'SELECT id, free_access, valid_until, subscription_status FROM schools WHERE id = $1',
            [id]
        );
        res.json({ success: true, message: 'School access updated', data: updated.rows[0] });
    } catch (err) {
        console.error('Error granting access:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Permanently delete a school AND all of its data
// @route   DELETE /api/super-admin/schools/:id
// @access  Super Admin
// Requires confirmName in the body to exactly match the school name (defense against accidental deletion).
exports.deleteSchool = async (req, res) => {
    const { id } = req.params;
    const { confirmName } = req.body || {};

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const schoolRes = await client.query('SELECT id, name FROM schools WHERE id = $1', [id]);
        if (schoolRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        const school = schoolRes.rows[0];

        // Safety: the typed confirmation must match the school name exactly.
        if (!confirmName || confirmName.trim() !== school.name) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Confirmation text does not match the school name.'
            });
        }

        // Remove rows whose school_id FK does NOT cascade, in dependency-safe order.
        await client.query('DELETE FROM subscription_logs WHERE school_id = $1', [id]);
        await client.query('DELETE FROM payment_links WHERE school_id = $1', [id]);
        // Deleting the school's users cascades their profiles, conversations, messages,
        // live sessions, notifications, and reset tokens (all user_id ON DELETE CASCADE).
        await client.query('DELETE FROM users WHERE school_id = $1', [id]);
        // Deleting the school cascades school_languages, sessions, and usage history.
        await client.query('DELETE FROM schools WHERE id = $1', [id]);

        await client.query('COMMIT');

        try {
            logAction(req.user.id, req.user.email, 'DELETE_SCHOOL', 'school', id, { name: school.name }, req);
        } catch (_) { /* audit best-effort */ }

        return res.json({ success: true, message: `"${school.name}" and all associated data were permanently deleted.` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete school error:', err);
        return res.status(500).json({ success: false, message: 'Server error while deleting school' });
    } finally {
        client.release();
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
            // Fallback for Super Admin
            if (req.user.role === 'super admin' || req.user.role === 'super_admin') {
                // Return system-wide data simulating a school object
                const languagesResult = await pool.query('SELECT id, name, code FROM languages WHERE is_active = true ORDER BY name ASC');
                const studentCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student' AND status NOT IN ('pending', 'rejected')");
                const teacherCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status NOT IN ('pending', 'rejected')");

                return res.json({
                    success: true,
                    data: {
                        name: 'System Administration',
                        allowed_languages: languagesResult.rows,
                        student_count: parseInt(studentCount.rows[0].count),
                        teacher_count: parseInt(teacherCount.rows[0].count),
                        minutes_limit: 999999,
                        minutes_used: 0
                    }
                });
            }
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
            street_address,
            city,
            state,
            zip_code,
            logo_url
        } = req.body;

        // School Admins can only update specific fields (NOT plan_tier, limits, etc.)
        const result = await pool.query(
            `UPDATE schools
             SET name = COALESCE($1, name),
                 contact_email = COALESCE($2, contact_email),
                 contact_number = COALESCE($3, contact_number),
                 street_address = COALESCE($4, street_address),
                 city = COALESCE($5, city),
                 state = COALESCE($6, state),
                 zip_code = COALESCE($7, zip_code),
                 logo_url = COALESCE($8, logo_url),
                 updated_at = NOW()
             WHERE id = $9
             RETURNING *`,
            [name, contact_email, contact_number, street_address ?? null, city ?? null, state ?? null, zip_code ?? null, logo_url, schoolId]
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
            if (req.user.role === 'super admin' || req.user.role === 'super_admin') {
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
            WHERE s.status = 'active'
              -- Only schools that are actually usable can accept registrations:
              -- complimentary access, OR a current paid/trial period (valid_until in the future).
              -- This hides schools that never paid (pending) or whose access expired.
              AND (s.free_access = true OR (s.valid_until IS NOT NULL AND s.valid_until >= NOW()))
            GROUP BY s.id
            ORDER BY s.name ASC
        `;

        const result = await pool.query(query);

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

        const pct = (used, limit) => (limit > 0 ? parseFloat(((used / limit) * 100).toFixed(1)) : 0);

        res.json({
            success: true,
            data: {
                minutes_used: school.minutes_used,
                minutes_limit: school.minutes_limit,
                minutes_percentage: parseFloat(minutesPercentage),
                minutes_remaining: school.minutes_limit - school.minutes_used,
                translation_chars_used: school.translation_chars_used || 0,
                translation_chars_limit: school.translation_chars_limit || 0,
                translation_chars_percentage: pct(school.translation_chars_used || 0, school.translation_chars_limit || 0),
                translation_chars_remaining: Math.max(0, (school.translation_chars_limit || 0) - (school.translation_chars_used || 0)),
                tts_chars_used: school.tts_chars_used || 0,
                tts_chars_limit: school.tts_chars_limit || 0,
                tts_chars_percentage: pct(school.tts_chars_used || 0, school.tts_chars_limit || 0),
                tts_chars_remaining: Math.max(0, (school.tts_chars_limit || 0) - (school.tts_chars_used || 0)),
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


// @desc    Get usage history for a school (one row per past billing/trial period)
// @route   GET /api/super-admin/schools/:id/usage-history
// @access  Super Admin
exports.getUsageHistory = async (req, res) => {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    try {
        const schoolCheck = await pool.query('SELECT id FROM schools WHERE id = $1', [id]);
        if (!schoolCheck.rows.length) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const { rows } = await pool.query(
            `SELECT id, period_type, period_start, period_end,
                    minutes_used, minutes_limit,
                    translation_chars_used, translation_chars_limit,
                    tts_chars_used, tts_chars_limit,
                    created_at
             FROM school_usage_history
             WHERE school_id = $1
             ORDER BY period_end DESC
             LIMIT $2 OFFSET $3`,
            [id, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM school_usage_history WHERE school_id = $1',
            [id]
        );

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit,
                offset,
            }
        });
    } catch (err) {
        console.error('Error fetching usage history:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Manually snapshot and reset usage for a school
// @route   POST /api/super-admin/schools/:id/usage-reset
// @access  Super Admin
exports.manualUsageReset = async (req, res) => {
    const { id } = req.params;
    try {
        const schoolCheck = await pool.query('SELECT id, name FROM schools WHERE id = $1', [id]);
        if (!schoolCheck.rows.length) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        await snapshotAndResetUsage(id, 'manual');

        try {
            logAction(req.user.id, req.user.email, 'MANUAL_USAGE_RESET', 'school', id, {}, req);
        } catch (e) { console.error('Audit log error', e); }

        res.json({ success: true, message: 'Usage reset and snapshot saved' });
    } catch (err) {
        console.error('Error resetting usage:', err);
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
