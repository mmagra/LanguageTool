const Joi = require('joi');

// From validation.js line 138
const createUserValidation = (data) => {
  const schema = Joi.object({
    first_name: Joi.string().trim().min(2).max(100).required(),
    last_name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().min(6).max(255).email({ tlds: { allow: false } }).required(),
    phone: Joi.string().allow('', null),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid('admin', 'teacher', 'student', 'super_admin').required(),
    school_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
    preferred_language_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  });

  return schema.validate(data);
};

// Test 1: submit 'super_admin'
const test1 = {
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  password: 'SecurePass123!',
  role: 'super_admin',
  school_id: 1
};

const result1 = createUserValidation(test1);
console.log('Test 1 (super_admin):', result1.error ? 'FAILS' : 'PASSES');
if (!result1.error) {
  console.log('  -> Would be inserted into DB with role:', result1.value.role);
}

// Test 2: submit 'super admin' with space
const test2 = {
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  password: 'SecurePass123!',
  role: 'super admin',
  school_id: 1
};

const result2 = createUserValidation(test2);
console.log('Test 2 (super admin):', result2.error ? 'FAILS' : 'PASSES');
if (result2.error) {
  console.log('  Error:', result2.error.details[0].message);
}
