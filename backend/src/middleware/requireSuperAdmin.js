const { ROLES } = require('../utils/constants');

const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.is_super_admin || req.user.role === ROLES.SUPER_ADMIN) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Super Admin access required'
    });
};

module.exports = requireSuperAdmin;
