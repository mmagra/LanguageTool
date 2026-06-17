const Stripe = require('stripe');
const config = require('./config');

// Single shared Stripe client. Returns null if no secret key is configured
// so the app still boots in environments where billing isn't set up yet —
// controllers guard on this and respond with a clear error.
let stripe = null;

if (config.stripe.secretKey) {
    stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2024-06-20',
        appInfo: { name: 'Spoken Edge Billing' },
    });
} else {
    console.warn('⚠️  STRIPE_SECRET_KEY not set — Stripe billing endpoints are disabled.');
}

module.exports = stripe;
