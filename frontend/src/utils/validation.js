import * as Yup from 'yup';

/**
 * Centralised, reusable validation rules so every form (login, registration,
 * admin create, super-admin create, password reset, change password) enforces
 * the SAME field-by-field rules. Keep this in sync with backend
 * `src/middleware/validation.js`.
 */

// ---------------------------------------------------------------------------
// Canonical patterns
// ---------------------------------------------------------------------------

// Password: min 8, at least one lowercase, one uppercase, one number, one special char.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character';

// Names: letters (incl. accented), spaces, apostrophes, dots and hyphens. No digits.
export const NAME_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;

// Phone: US-style 10 digits, displayed as (000) 000 0000.
export const PHONE_REGEX = /^\(\d{3}\) \d{3} \d{4}$/;
export const PHONE_DIGITS = 10;
export const PHONE_MESSAGE = 'Enter a valid phone number in the format (000) 000 0000';

// Username / Student ID / Employee ID: letters, numbers, dot, dash, underscore.
export const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,50}$/;

// Live human-readable checklist (used by password fields with a hint list).
export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// ---------------------------------------------------------------------------
// Input sanitisers — restrict what a user can physically type into a field
// ---------------------------------------------------------------------------

// Strip everything except digits (max 10) and progressively format as (000) 000 0000.
// Typing letters/symbols is simply ignored, so a phone field can never hold non-digits.
export const formatPhone = (value = '') => {
  const d = String(value).replace(/\D/g, '').slice(0, PHONE_DIGITS);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6)}`;
};

// Bare digits of a phone value (used for storage / validation).
export const phoneDigits = (value = '') => String(value).replace(/\D/g, '');

// Valid when empty (optional field) OR exactly 10 digits.
export const isValidPhone = (value = '') => {
  const len = phoneDigits(value).length;
  return len === 0 || len === PHONE_DIGITS;
};

// Sanitiser used by form inputs — formats as the user types so only a valid
// (000) 000 0000 string can ever be entered.
export const sanitizePhone = (value = '') => formatPhone(value);

// Strip digits from a name field (letters / spaces / '.- only).
export const sanitizeName = (value = '') => value.replace(/[^\p{L}\s'.-]/gu, '');

// Username: alphanumeric plus . _ -
export const sanitizeUsername = (value = '') => value.replace(/[^A-Za-z0-9._-]/g, '');

// ---------------------------------------------------------------------------
// Reusable Yup field schemas
// ---------------------------------------------------------------------------

export const emailSchema = Yup.string()
  .trim()
  .email('Enter a valid email address')
  .max(255, 'Email is too long');

export const passwordSchema = Yup.string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`)
  .matches(PASSWORD_REGEX, PASSWORD_MESSAGE);

export const nameSchema = (label = 'This field') =>
  Yup.string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(100, `${label} is too long`)
    .matches(NAME_REGEX, `${label} can only contain letters`);

export const phoneSchema = Yup.string()
  .trim()
  .matches(PHONE_REGEX, PHONE_MESSAGE);

export const usernameSchema = Yup.string()
  .trim()
  .matches(USERNAME_REGEX, 'Use 3–50 letters, numbers, dot, dash or underscore');

// confirm-password helper bound to a sibling field
export const confirmPasswordSchema = (ref = 'password') =>
  Yup.string()
    .oneOf([Yup.ref(ref), null], 'Passwords must match')
    .required('Please confirm your password');
