const { pool } = require('../config/database');

// @desc    Get current user's notifications (most recent 50)
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [req.user.id]
        );

        const unreadCount = result.rows.filter(n => !n.read).length;

        res.json({
            success: true,
            data: result.rows,
            unread_count: unreadCount
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Mark one notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markOneRead = async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
            [req.user.id]
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete one notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Helper: create a notification for a user
const createNotification = async (userId, type, title, body) => {
    try {
        await pool.query(
            `INSERT INTO notifications (user_id, type, title, body) VALUES ($1, $2, $3, $4)`,
            [userId, type, title, body]
        );
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
};

module.exports = { ...module.exports, createNotification };
