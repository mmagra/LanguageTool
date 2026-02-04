// Middleware to check if user is Super Admin
const requireSuperAdmin = (req, res, next) => {
    // Check if user object exists (ensure protect middleware ran first)
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Check super admin flag or role
    if (req.user.is_super_admin || req.user.role === 'super_admin') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Super Admin access required/Access Denied'
    });
};

module.exports = requireSuperAdmin;
