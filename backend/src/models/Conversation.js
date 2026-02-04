const db = require('../config/database');

class Conversation {
    // Get all conversations for a user
    static async getByUserId(userId) {
        const query = `
      SELECT 
        c.id, c.subject, c.created_at, c.updated_at,
        s.id as student_id, s.first_name as student_first_name, s.last_name as student_last_name, s.is_online as student_is_online,
        s.email as student_email, s.phone as student_phone, s.username as student_username, s.profile_image as student_profile_image,
        sp.guardian_name, sp.guardian_relation, l.name as preferred_language,
        g.name as grade_name,
        t.id as teacher_id, t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.email as teacher_email, t.is_online as teacher_is_online, t.profile_image as teacher_profile_image,
        
        -- Use denormalized columns efficiently
        c.last_message_content as last_message,
        c.last_message_sender_id,
        c.last_message_at,
        (SELECT m.translated_content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.sent_at DESC LIMIT 1) as last_message_translated,
        
        -- Select correct unread count based on role
        CASE 
            WHEN c.teacher_id = $1 THEN c.teacher_unread_count
            WHEN c.student_id = $1 THEN c.student_unread_count
            ELSE 0
        END as unread_count,
        
        CASE 
            WHEN c.teacher_id = $1 THEN c.teacher_last_read_at
            WHEN c.student_id = $1 THEN c.student_last_read_at
            ELSE NULL
        END as last_read_at

      FROM conversations c
      JOIN users s ON c.student_id = s.id
      LEFT JOIN student_profiles sp ON s.id = sp.user_id
      LEFT JOIN languages l ON sp.preferred_language_id = l.id
      LEFT JOIN grades g ON sp.grade_id = g.id
      JOIN users t ON c.teacher_id = t.id
      WHERE c.student_id = $1 OR c.teacher_id = $1
      ORDER BY c.updated_at DESC
    `;

        try {
            const result = await db.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching conversations: ${error.message}`);
        }
    }

    // Get ALL conversations (Admin)
    static async getAll(schoolId = null) {
        let query = `
      SELECT 
        c.id, c.subject, c.created_at, c.updated_at,
        s.id as student_id, s.first_name as student_first_name, s.last_name as student_last_name, s.is_online as student_is_online,
        s.email as student_email, s.phone as student_phone, s.username as student_username, s.profile_image as student_profile_image,
        sp.guardian_name, sp.guardian_relation, l.name as preferred_language,
        g.name as grade_name,
        t.id as teacher_id, t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.email as teacher_email, t.is_online as teacher_is_online, t.profile_image as teacher_profile_image,
        
        c.last_message_content as last_message,
        c.last_message_sender_id,
        c.last_message_at,
        (SELECT m.translated_content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.sent_at DESC LIMIT 1) as last_message_translated,
        
        -- For admin, generic unread count (0 for now, or could sum generic ones)
        0 as unread_count,
        NULL as last_read_at

      FROM conversations c
      JOIN users s ON c.student_id = s.id
      LEFT JOIN student_profiles sp ON s.id = sp.user_id
      LEFT JOIN languages l ON sp.preferred_language_id = l.id
      LEFT JOIN grades g ON sp.grade_id = g.id
      JOIN users t ON c.teacher_id = t.id
    `;

        const params = [];
        if (schoolId) {
            query += ` WHERE s.school_id = $1`;
            params.push(schoolId);
        }

        query += ` ORDER BY c.updated_at DESC`;

        try {
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching all conversations: ${error.message}`);
        }
    }

    // Get conversation by ID
    static async findById(id) {
        const query = `
      SELECT 
        c.id, c.subject, c.student_id, c.teacher_id, c.created_at,
        s.first_name as student_first_name, s.last_name as student_last_name, s.is_online as student_is_online,
        s.email as student_email, s.phone as student_phone, s.username as student_username, s.profile_image as student_profile_image,
        s.school_id as student_school_id, 
        sp.guardian_name, sp.guardian_relation, l.name as preferred_language,
        g.name as grade_name,
        t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.email as teacher_email, t.is_online as teacher_is_online, t.profile_image as teacher_profile_image
      FROM conversations c
      JOIN users s ON c.student_id = s.id
      LEFT JOIN student_profiles sp ON s.id = sp.user_id
      LEFT JOIN languages l ON sp.preferred_language_id = l.id
      LEFT JOIN grades g ON sp.grade_id = g.id
      JOIN users t ON c.teacher_id = t.id
      WHERE c.id = $1
    `;

        try {
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error finding conversation: ${error.message}`);
        }
    }

    // Create new conversation
    static async create(studentId, teacherId, subject) {
        const query = `
      INSERT INTO conversations (student_id, teacher_id, subject, teacher_last_read_at, student_last_read_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

        try {
            const result = await db.query(query, [studentId, teacherId, subject]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error creating conversation: ${error.message}`);
        }
    }

    // Get messages for a conversation with pagination
    static async getMessages(conversationId, limit = 50, offset = 0) {
        const query = `
      SELECT 
        m.id, m.sender_id, m.sender_name, m.content, m.translated_content, m.sent_at,
        u.first_name, u.last_name, u.role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.sent_at DESC
      LIMIT $2 OFFSET $3
    `;

        try {
            const result = await db.query(query, [conversationId, limit, offset]);
            // Reverse to show oldest to newest in the chat UI
            return result.rows.reverse();
        } catch (error) {
            throw new Error(`Error fetching messages: ${error.message}`);
        }
    }

    // Add message to conversation
    static async addMessage(conversationId, senderId, senderName, content, translatedContent = null) {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Insert message
            const messageQuery = `
        INSERT INTO messages (conversation_id, sender_id, sender_name, content, translated_content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
            const messageResult = await client.query(messageQuery, [conversationId, senderId, senderName, content, translatedContent]);
            const message = messageResult.rows[0];

            // Update conversation:
            // 1. Update timestamp, last message info
            // 2. Increment unread count for the recipient
            // 3. Update last_read_at for the sender (since they just sent it)

            await client.query(
                `UPDATE conversations 
                 SET updated_at = CURRENT_TIMESTAMP,
                     last_message_content = $2,
                     last_message_at = CURRENT_TIMESTAMP,
                     last_message_sender_id = $3,
                     
                     -- Increment unread count for the OTHER person
                     teacher_unread_count = CASE WHEN student_id = $3 THEN teacher_unread_count + 1 ELSE teacher_unread_count END,
                     student_unread_count = CASE WHEN teacher_id = $3 THEN student_unread_count + 1 ELSE student_unread_count END,

                     -- Update read status for sender
                     teacher_last_read_at = CASE WHEN teacher_id = $3 THEN CURRENT_TIMESTAMP ELSE teacher_last_read_at END,
                     student_last_read_at = CASE WHEN student_id = $3 THEN CURRENT_TIMESTAMP ELSE student_last_read_at END
                     
                 WHERE id = $1`,
                [conversationId, content, senderId]
            );

            await client.query('COMMIT');
            return message;
        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(`Error adding message: ${error.message}`);
        } finally {
            client.release();
        }
    }

    // Mark conversation as read
    static async markAsRead(conversationId, userId) {
        // We need to know who is reading to clear the correct counter
        const query = `
            UPDATE conversations
            SET 
                teacher_last_read_at = CASE WHEN teacher_id = $2 THEN CURRENT_TIMESTAMP ELSE teacher_last_read_at END,
                student_last_read_at = CASE WHEN student_id = $2 THEN CURRENT_TIMESTAMP ELSE student_last_read_at END,
                
                -- Reset unread count for this user
                teacher_unread_count = CASE WHEN teacher_id = $2 THEN 0 ELSE teacher_unread_count END,
                student_unread_count = CASE WHEN student_id = $2 THEN 0 ELSE student_unread_count END
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await db.query(query, [conversationId, userId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error marking as read: ${error.message}`);
        }
    }
    // Delete conversation
    static async delete(id) {
        const query = 'DELETE FROM conversations WHERE id = $1';
        try {
            await db.query(query, [id]);
            return true;
        } catch (error) {
            throw new Error(`Error deleting conversation: ${error.message}`);
        }
    }
}

module.exports = Conversation;
