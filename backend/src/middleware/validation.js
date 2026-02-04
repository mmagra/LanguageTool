const Joi = require('joi');

// Register validation
const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(2).max(50).required(), // Student ID or Employee ID
    email: Joi.string().min(6).max(255).required().email(),
    password: Joi.string().min(8).max(20).required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('teacher', 'student').required(),
    phone: Joi.string().allow('', null),

    // Student specific
    guardianName: Joi.string().allow('', null),
    guardianRelation: Joi.string().allow('', null),
    gradeId: Joi.number().integer().allow(null),
    preferredLanguage: Joi.string().allow('', null),

    // Teacher/Student specific
    schoolName: Joi.string().allow('', null),
    schoolId: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  });

  return schema.validate(data);
};

// Login validation (accepts username or email)
const loginValidation = (data) => {
  const schema = Joi.object({
    identifier: Joi.string().min(3).max(255).required()
      .messages({ 'any.required': 'Username or email is required' }),
    password: Joi.string().min(6).max(1024).required(),
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
  approveUserValidation,
  validate,
};