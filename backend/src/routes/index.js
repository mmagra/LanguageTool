const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const gradeRoutes = require('./gradeRoutes');
const teacherRoutes = require('./teacherRoutes');
const studentRoutes = require('./studentRoutes');
const messageRoutes = require('./messageRoutes');
const translationRoutes = require('./translationRoutes');
const languageRoutes = require('./languageRoutes');
const schoolRoutes = require('./schoolRoutes');
const superAdminUserRoutes = require('./superAdminUserRoutes');
const brandingRoutes = require('./brandingRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const alertsRoutes = require('./alertsRoutes');

// Route groups
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/grades', gradeRoutes);
router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);
router.use('/messages', messageRoutes);
router.use('/messages', messageRoutes);
router.use('/translate', translationRoutes);
router.use('/sessions', require('./sessionRoutes'));

// Super Admin / System Routes (Self-contained paths starting with / or /system)
// These routers define their own full paths relative to /api base
router.use(languageRoutes);
router.use(schoolRoutes);
router.use(superAdminUserRoutes);
router.use(brandingRoutes);
router.use(analyticsRoutes);
router.use(alertsRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Spoken Edge API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;