const { protect } = require('./middleware/auth');
const requireSchoolActive = require('./middleware/requireSchoolActive');
const dns = require('dns');
// Force IPv4 to fix "ENETUNREACH" errors on some platforms (Railway/Render)
// when connecting to dual-stack databases (Supabase/Neon).
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const app = require('./app');

const config = require('./config/config');
const db = require('./config/database');
const bcrypt = require('bcryptjs');

const runMigrations = async () => {
  try {
    // Normalize role constraint
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await db.query(`UPDATE users SET role = 'super admin' WHERE role = 'super_admin'`);
    await db.query(`ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'teacher', 'student', 'super admin'))`);

    // Create password_reset_tokens table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notifications table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        body TEXT,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, read)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC)`);

    // Backfill per-school premium API feature flags (default false) onto existing schools
    await db.query(`
      UPDATE schools
      SET features = COALESCE(features, '{}'::jsonb) || '{"premium_translation": false, "premium_tts": false}'::jsonb
      WHERE NOT (COALESCE(features, '{}'::jsonb) ? 'premium_translation')
    `);

    // Per-language TTS capability + chosen voice columns.
    // Added nullable first so existing rows are NULL → backfilled once → default set after.
    await db.query(`ALTER TABLE languages ADD COLUMN IF NOT EXISTS tts_free BOOLEAN`);
    await db.query(`ALTER TABLE languages ADD COLUMN IF NOT EXISTS tts_premium BOOLEAN`);
    await db.query(`ALTER TABLE languages ADD COLUMN IF NOT EXISTS voice_name VARCHAR(100)`);
    await db.query(`ALTER TABLE languages ADD COLUMN IF NOT EXISTS voice_gender VARCHAR(10)`);
    // One-time backfill: a language with a speech_code can both browser-speak and (likely) Cloud-speak.
    // Idempotent — once set non-NULL it won't be touched again, so admin changes are preserved.
    await db.query(`
      UPDATE languages
      SET tts_premium = (speech_code IS NOT NULL),
          tts_free = (speech_code IS NOT NULL)
      WHERE tts_premium IS NULL OR tts_free IS NULL
    `);
    await db.query(`ALTER TABLE languages ALTER COLUMN tts_free SET DEFAULT FALSE`);
    await db.query(`ALTER TABLE languages ALTER COLUMN tts_premium SET DEFAULT FALSE`);

    // Per-school usage meters for paid Google APIs (translation + voice characters)
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS translation_chars_limit INTEGER DEFAULT 500000`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS translation_chars_used INTEGER DEFAULT 0`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS tts_chars_limit INTEGER DEFAULT 250000`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS tts_chars_used INTEGER DEFAULT 0`);

    // Stripe recurring billing columns
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255)`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'none'`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10, 2)`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS next_renewal_at TIMESTAMP WITH TIME ZONE`);
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS free_access BOOLEAN DEFAULT false`);
    await db.query(`ALTER TABLE subscription_logs ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255)`);
    await db.query(`ALTER TABLE subscription_logs ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_subscription_logs_stripe_invoice ON subscription_logs(stripe_invoice_id)`);
    await db.query(`CREATE TABLE IF NOT EXISTS payment_links (
        id SERIAL PRIMARY KEY,
        code VARCHAR(16) UNIQUE NOT NULL,
        school_id INTEGER REFERENCES schools(id),
        target_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_payment_links_code ON payment_links(code)`);

    // Confirm the short-link table exists (short payment links depend on it).
    const linkTable = await db.query("SELECT to_regclass('public.payment_links') AS t");
    console.log(linkTable.rows[0].t
        ? '✅ payment_links table present (short links enabled)'
        : '⚠️  payment_links table missing — short links will fall back to full URLs');

    // Every school must allow at least English, otherwise the student registration
    // language dropdown is empty and students can't pick a language (→ NULL language).
    const englishBackfill = await db.query(`
        INSERT INTO school_languages (school_id, language_id)
        SELECT s.id, l.id
        FROM schools s
        CROSS JOIN (SELECT id FROM languages WHERE code = 'en' ORDER BY id LIMIT 1) l
        WHERE NOT EXISTS (
            SELECT 1 FROM school_languages sl WHERE sl.school_id = s.id AND sl.language_id = l.id
        )
        ON CONFLICT DO NOTHING
        RETURNING school_id
    `);
    if (englishBackfill.rowCount > 0) {
        console.log(`✅ Ensured English language access for ${englishBackfill.rowCount} school(s)`);
    }

    // Usage history per billing/trial period
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    await db.query(`
        CREATE TABLE IF NOT EXISTS school_usage_history (
            id SERIAL PRIMARY KEY,
            school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('paid', 'trial', 'free', 'manual')),
            period_start TIMESTAMP WITH TIME ZONE NOT NULL,
            period_end   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            minutes_used INTEGER DEFAULT 0,
            minutes_limit INTEGER DEFAULT 0,
            translation_chars_used INTEGER DEFAULT 0,
            translation_chars_limit INTEGER DEFAULT 0,
            tts_chars_used INTEGER DEFAULT 0,
            tts_chars_limit INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_school_usage_history_school ON school_usage_history(school_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_school_usage_history_end ON school_usage_history(period_end DESC)`);

    console.log('✅ DB migrations applied');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  }
};

// Ensure the dedicated SUPER ADMIN bootstrap account exists.
// IMPORTANT: this targets config.superAdminEmail (a distinct account), NOT the school
// admin (config.adminEmail). Never promote the school admin here — doing so re-breaks
// role-based redirects for the school admin on every server start.
const createAdminUser = async () => {
  try {
    const superAdminEmail = config.superAdminEmail;

    // No credentials configured → skip bootstrap entirely (no insecure default account)
    if (!superAdminEmail || !config.superAdminPassword) {
      console.warn('⚠️  SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super-admin bootstrap.');
      return;
    }

    // Safety guard: refuse to run if the super-admin email is misconfigured to equal the school admin
    if (superAdminEmail === config.adminEmail) {
      console.error('❌ SUPER_ADMIN_EMAIL must differ from ADMIN_EMAIL; skipping super-admin bootstrap.');
      return;
    }

    const checkQuery = 'SELECT id, role FROM users WHERE email = $1';
    const result = await db.query(checkQuery, [superAdminEmail]);

    if (result.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(config.superAdminPassword, salt);

      const createQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, role, status
      `;

      const values = [
        superAdminEmail,
        passwordHash,
        'System',
        'Administrator',
        'super admin',
        'active'
      ];

      await db.query(createQuery, values);
      console.log('✅ Super admin user created successfully');
      console.log(`📧 Email: ${superAdminEmail}`);
    } else if (result.rows[0].role !== 'super admin') {
      // Only fix the dedicated super-admin account's role — never the school admin's.
      await db.query('UPDATE users SET role = $1 WHERE email = $2', ['super admin', superAdminEmail]);
      console.log('✅ Super admin role ensured');
    } else {
      console.log('✅ Super admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring super admin user:', error.message);
  }
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Run migrations then create admin user
    await runMigrations();
    await createAdminUser();

    // Create HTTP server for Socket.io
    const http = require('http');
    const server = http.createServer(app);

    // Initialize Socket.io
    const socketManager = require('./socket/socketManager');
    socketManager.init(server);

    // Start server
    server.listen(config.port, () => {
      console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`🌐 API available at http://localhost:${config.port}/api`);
      console.log(`⚡ Socket.io initialized`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  db.pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();