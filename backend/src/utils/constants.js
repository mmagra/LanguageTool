module.exports = {
  USER_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ACTIVE: 'active',
    ALLOWED: 'allowed'
  },

  USER_ROLES: {
    SUPER_ADMIN: 'super admin',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
  },

  ROLES: {
    SUPER_ADMIN: 'super admin',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
  },
  
  API_RESPONSE_MESSAGES: {
    REGISTER_SUCCESS: 'Registration successful. Please wait for admin approval.',
    REGISTER_EMAIL_EXISTS: 'Email already exists',
    LOGIN_SUCCESS: 'Login successful',
    LOGIN_INVALID_CREDENTIALS: 'Invalid email or password',
    LOGIN_PENDING_APPROVAL: 'Your account is pending approval by admin',
    USER_APPROVED: 'User approved successfully',
    USER_REJECTED: 'User rejected successfully',
    USER_NOT_FOUND: 'User not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden access'
  }
};