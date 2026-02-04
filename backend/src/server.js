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

// Function to create admin user if doesn't exist
const createAdminUser = async () => {
  try {
    const adminEmail = config.adminEmail;

    // Check if admin exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1 AND role = $2';
    const result = await db.query(checkQuery, [adminEmail, 'admin']);

    if (result.rows.length === 0) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(config.adminPassword, salt);

      // Create admin user
      const createQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, role, status
      `;

      const values = [
        adminEmail,
        passwordHash,
        'System',
        'Administrator',
        'super admin',
        'active'
      ];

      await db.query(createQuery, values);
      console.log('✅ Admin user created successfully');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${config.adminPassword}`);
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Create admin user
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

startServer();