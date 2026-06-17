require('dotenv').config();

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '7d',
  },

  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,

  // Dedicated super-admin bootstrap account (must differ from the school admin above).
  // No insecure fallback — bootstrap is skipped unless BOTH are explicitly set in the env.
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || null,
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || null,

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Single Google Cloud API key reused for paid Translation + Text-to-Speech.
  // Falls back to the legacy GOOGLE_TRANSLATE_API_KEY var if present.
  googleApiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY || null,

  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Stripe recurring billing (test or live keys)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || null,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

module.exports = config;