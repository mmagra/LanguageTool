const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Key by authenticated user id when present, else fall back to the IPv6-safe IP key.
const userOrIpKey = (req) => (req.user && req.user.id ? `u:${req.user.id}` : ipKeyGenerator(req.ip));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, please try again in 15 minutes.' }
});

const translateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Translation rate limit exceeded. Please slow down.' }
});

// Stricter limiter for password-reset token submission (brute-force surface)
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many reset attempts, please try again in 15 minutes.' }
});

// Per-user limiter for messaging endpoints (spam / DoS protection)
const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userOrIpKey,
    message: { success: false, message: 'You are sending messages too quickly. Please slow down.' }
});

// Limiter for sensitive payment / subscription write operations
const paymentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userOrIpKey,
    message: { success: false, message: 'Too many payment operations. Please slow down.' }
});

module.exports = { authLimiter, translateLimiter, passwordResetLimiter, messageLimiter, paymentLimiter };
