const { pool } = require('../config/database');

/**
 * Middleware to log Super Admin actions to audit_logs table
 * @param {string} action - Action being performed (e.g., 'CREATE_SCHOOL')
 * @param {string} resourceType - Type of resource (e.g., 'school', 'payment')
 * @param {number} resourceId - ID of the resource (optional)
 * @param {object} details - Additional details about the action (optional)
 */
const auditLog = (action, resourceType, resourceId = null, details = {}) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            // Only log if the action was successful
            if (data.success !== false && res.statusCode < 400) {
                // Log asynchronously (don't block response)
                logAuditEntry(req, action, resourceType, resourceId, details, data)
                    .catch(err => console.error('Audit log error:', err));
            }
            return originalJson(data);
        };

        next();
    };
};

/**
 * Log an audit entry to the database
 */
const logAuditEntry = async (req, action, resourceType, resourceId, details, responseData) => {
    try {
        const user = req.user;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        // Extract resource ID from response if not provided
        let finalResourceId = resourceId;
        if (!finalResourceId && responseData?.data?.id) {
            finalResourceId = responseData.data.id;
        }

        // Merge request body with additional details
        const finalDetails = {
            ...details,
            requestBody: req.body,
            params: req.params,
            query: req.query
        };

        await pool.query(`
            INSERT INTO audit_logs 
            (user_id, user_email, action, resource_type, resource_id, details, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            user?.id || null,
            user?.email || 'unknown',
            action,
            resourceType,
            finalResourceId,
            JSON.stringify(finalDetails),
            ipAddress,
            userAgent
        ]);
    } catch (error) {
        // Don't throw - audit logging should not break the main flow
        console.error('Failed to create audit log:', error);
    }
};

/**
 * Manual audit logging function for use outside middleware
 */
const createAuditLog = async (userId, userEmail, action, resourceType, resourceId, details = {}) => {
    try {
        await pool.query(`
            INSERT INTO audit_logs 
            (user_id, user_email, action, resource_type, resource_id, details)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            userId,
            userEmail,
            action,
            resourceType,
            resourceId,
            JSON.stringify(details)
        ]);
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

module.exports = { auditLog, createAuditLog };
