const Joi = require('joi');

/**
 * Centralised validation rules. Every auth / user-creation flow shares the SAME
 * field-by-field rules so the API can never accept data the UI would reject
 * (or vice-versa). Keep in sync with frontend `src/utils/validation.js`.
 */

// ---------------------------------------------------------------------------
// Canonical patterns
// ---------------------------------------------------------------------------

// Password: min 8, at least one lowercase, uppercase, number and special char.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character';

// Names: letters (unicode), spaces, apostrophes, dots, hyphens. No digits.
const NAME_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;

// Phone: US-style 10 digits, displayed as (000) 000 0000.
const PHONE_REGEX = /^\(\d{3}\) \d{3} \d{4}$/;
const PHONE_DIGITS = 10;
const PHONE_MESSAGE = 'Enter a valid phone number in the format (000) 000 0000';

// Username / Student ID / Employee ID.
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,50}$/;

// ---------------------------------------------------------------------------
// Reusable field schemas
// ---------------------------------------------------------------------------

const passwordField = Joi.string().min(8).max(128).pattern(PASSWORD_REGEX)
  .messages({ 'string.pattern.base': PASSWORD_MESSAGE });

const emailField = Joi.string().min(6).max(255).email({ tlds: { allow: false } })
  .messages({ 'string.email': 'Enter a valid email address' });

const nameField = (label) => Joi.string().trim().min(2).max(100).pattern(NAME_REGEX)
  .messages({ 'string.pattern.base': `${label} can only contain letters` });

// Accept the formatted "(000) 000 0000" the UI sends, or any value that reduces
// to exactly 10 digits. Empty/null is permitted via .allow('', null) at use sites.
const phoneField = Joi.string().trim().custom((value, helpers) => {
  if (String(value).replace(/\D/g, '').length !== PHONE_DIGITS) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({ 'any.invalid': PHONE_MESSAGE });

const usernameField = Joi.string().trim().pattern(USERNAME_REGEX)
  .messages({ 'string.pattern.base': 'Username must be 3–50 letters, numbers, dot, dash or underscore' });

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

// Register validation
const registerValidation = (data) => {
  const schema = Joi.object({
    username: usernameField.required(),
    email: emailField.required(),
    password: passwordField.required(),
    firstName: nameField('First name').required(),
    lastName: nameField('Last name').required(),
    role: Joi.string().valid('teacher', 'student').required(),
    phone: phoneField.allow('', null),

    // Student specific
    guardianName: nameField('Guardian name').allow('', null),
    guardianRelation: Joi.string().allow('', null),
    gradeId: Joi.number().integer().allow(null),
    preferredLanguage: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null),

    // Teacher/Student specific
    schoolName: Joi.string().allow('', null),
    schoolId: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  });

  return schema.validate(data);
};

// Login validation (accepts username or email)
const loginValidation = (data) => {
  const schema = Joi.object({
    identifier: Joi.string().max(255).required()
      .messages({ 'any.required': 'Username or email is required' }),
    password: Joi.string().min(1).max(1024).required(),
  });

  return schema.validate(data);
};

// Change password (logged-in user)
const changePasswordValidation = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required()
      .messages({ 'any.required': 'Current password is required' }),
    newPassword: passwordField.required(),
  });

  return schema.validate(data);
};

// Reset password with emailed token
const resetPasswordValidation = (data) => {
  const schema = Joi.object({
    token: Joi.string().required(),
    newPassword: passwordField.required(),
  });

  return schema.validate(data);
};

// Forgot password request
const forgotPasswordValidation = (data) => {
  const schema = Joi.object({
    email: emailField.required(),
  });

  return schema.validate(data);
};

// Admin creates an admin account
const createAdminValidation = (data) => {
  const schema = Joi.object({
    firstName: nameField('First name').required(),
    lastName: nameField('Last name').required(),
    email: emailField.required(),
    phone: phoneField.allow('', null),
    username: usernameField.required(),
    password: passwordField.required(),
  });

  return schema.validate(data);
};

// Super-admin creates any user
const createUserValidation = (data) => {
  const schema = Joi.object({
    first_name: nameField('First name').required(),
    last_name: nameField('Last name').required(),
    email: emailField.required(),
    phone: phoneField.allow('', null),
    password: passwordField.required(),
    role: Joi.string().valid('admin', 'teacher', 'student', 'super_admin').required(),
    school_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
    preferred_language_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  });

  return schema.validate(data);
};

// Super-admin creates a school + its initial admin (extra plan fields allowed via unknown:true)
const createSchoolValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(150).required()
      .messages({ 'string.empty': 'School name is required', 'any.required': 'School name is required' }),
    contact_email: emailField.required(),
    contact_number: phoneField.allow('', null),

    // USA mailing address (optional)
    street_address: Joi.string().trim().max(255).allow('', null),
    city: Joi.string().trim().max(100).allow('', null),
    state: Joi.string().trim().max(50).allow('', null),
    zip_code: Joi.string().trim().pattern(/^\d{5}(-\d{4})?$/).allow('', null)
      .messages({ 'string.pattern.base': 'Enter a valid US ZIP code (e.g. 12345 or 12345-6789)' }),

    admin_first_name: nameField('Admin first name').required(),
    admin_last_name: nameField('Admin last name').allow('', null),
    admin_email: emailField.required(),
    admin_phone: phoneField.allow('', null),
    admin_username: usernameField.allow('', null),
    admin_password: passwordField.required(),
  }).unknown(true); // plan/limits/language fields validated elsewhere

  return schema.validate(data);
};

// Admin/super-admin overrides another user's password
const adminSetPasswordValidation = (data) => {
  const schema = Joi.object({
    password: passwordField.required(),
  });

  return schema.validate(data);
};

// User approval validation
const approveUserValidation = (data) => {
  const schema = Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
  });

  return schema.validate(data);
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  resetPasswordValidation,
  forgotPasswordValidation,
  createAdminValidation,
  createUserValidation,
  createSchoolValidation,
  adminSetPasswordValidation,
  approveUserValidation,
  validate,
  // exported patterns for reuse/tests
  PASSWORD_REGEX,
  PASSWORD_MESSAGE,
};
