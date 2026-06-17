const { pool } = require('../config/database');
const socketManager = require('../socket/socketManager');
const { logAction } = require('./auditController');

// @desc    Start a live conversation
// @route   POST /api/sessions/start
// @access  Teacher
exports.startSession = async (req, res) => {
    const { student_id } = req.body;
    const teacher_id = req.user.id;
    const school_id = req.user.school_id;

    if (!student_id) {
        return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    try {
        // Check for existing active session — do NOT auto-end, require explicit end
        const existingSession = await pool.query(
            `SELECT id FROM sessions WHERE teacher_id = $1 AND status = 'active'`,
            [teacher_id]
        );
        if (existingSession.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You already have an active session. Please end it before starting a new one.'
            });
        }

        // Check school minutes quota
        if (school_id) {
            const schoolResult = await pool.query(
                'SELECT minutes_used, minutes_limit FROM schools WHERE id = $1',
                [school_id]
            );
            if (schoolResult.rows.length > 0) {
                const { minutes_used, minutes_limit } = schoolResult.rows[0];
                if (minutes_limit > 0 && minutes_used >= minutes_limit) {
                    return res.status(403).json({
                        success: false,
                        message: 'Your school has reached its session minutes limit. Please contact your administrator.'
                    });
                }
            }
        }

        const result = await pool.query(
            `INSERT INTO sessions (teacher_id, student_id, school_id, start_time, status)
             VALUES ($1, $2, $3, NOW(), 'active')
             RETURNING *`,
            [teacher_id, student_id, school_id]
        );

        const session = result.rows[0];

        try {
            logAction(teacher_id, null, 'START_SESSION', 'session', session.id, {
                student_id, school_id
            }, null);
        } catch (e) { console.error('Audit log error', e); }

        res.status(201).json({ success: true, data: session });
    } catch (err) {
        console.error('Error starting session:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    End a live conversation
// @route   POST /api/sessions/end
// @access  Teacher
exports.endSession = async (req, res) => {
    const teacher_id = req.user.id;
    const school_id = req.user.school_id;

    // Optional: Accept session_id, or just end the active one for this teacher
    const { session_id } = req.body;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Find active session
            let query = `SELECT * FROM sessions WHERE teacher_id = $1 AND status = 'active'`;
            const params = [teacher_id];

            if (session_id) {
                query += ` AND id = $2`;
                params.push(session_id);
            }

            const activeSessionRes = await client.query(query, params);

            if (activeSessionRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'No active session found' });
            }

            const session = activeSessionRes.rows[0];

            // Update Session
            // Calculate duration in minutes (ceil recommended for billing/usage?) or round?
            // "Extract epoch" gives seconds. / 60 = minutes.
            // Let's use CEIL to ensure at least 1 min usage if started.
            const updateRes = await client.query(
                `UPDATE sessions 
                 SET status = 'completed', 
                     end_time = NOW(), 
                     duration_minutes = CEIL(EXTRACT(EPOCH FROM (NOW() - start_time))/60)
                 WHERE id = $1
                 RETURNING *`,
                [session.id]
            );

            const updatedSession = updateRes.rows[0];
            const minutesUsed = updatedSession.duration_minutes || 0;

            // Update School Quota
            if (minutesUsed > 0) {
                await client.query(
                    `UPDATE schools 
                     SET minutes_used = minutes_used + $1
                     WHERE id = $2`,
                    [minutesUsed, school_id]
                );
            }

            await client.query('COMMIT');

            try {
                logAction(teacher_id, null, 'END_SESSION', 'session', session.id, {
                    student_id: session.student_id, minutes_used: minutesUsed, school_id
                }, null);
            } catch (e) { console.error('Audit log error', e); }

            const io = socketManager.getIO();
            if (io) {
                io.to(String(session.student_id)).emit('session_ended', {
                    sessionId: session.id,
                    duration: minutesUsed
                });
                io.to(String(teacher_id)).emit('session_ended', {
                    sessionId: session.id,
                    duration: minutesUsed
                });
            }

            res.json({
                success: true,
                data: updatedSession,
                message: `Session ended. ${minutesUsed} minutes deducted.`
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error ending session:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get current active session
// @route   GET /api/sessions/active
// @access  Teacher
exports.getActiveSession = async (req, res) => {
    const teacher_id = req.user.id;

    try {
        const result = await pool.query(
            `SELECT s.*, 
                    u.first_name as student_first_name, u.last_name as student_last_name, 
                    u.profile_image as student_profile_image
             FROM sessions s
             JOIN users u ON s.student_id = u.id
             WHERE s.teacher_id = $1 AND s.status = 'active'`,
            [teacher_id]
        );

        if (result.rows.length === 0) {
            return res.json({ success: true, active: false });
        }

        res.json({
            success: true,
            active: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching active session:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
