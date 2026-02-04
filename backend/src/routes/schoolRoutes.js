const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

// Super Admin routes
router.get('/super-admin/schools', protect, requireSuperAdmin, schoolController.getAllSchools);
router.get('/super-admin/schools/:id', protect, requireSuperAdmin, schoolController.getSchoolById);
router.post('/super-admin/schools', protect, requireSuperAdmin, schoolController.createSchool);
router.put('/super-admin/schools/:id', protect, requireSuperAdmin, schoolController.updateSchool);
router.post('/super-admin/schools/:id/logo', protect, requireSuperAdmin, schoolController.updateSchoolLogo);
router.get('/super-admin/schools/:id/admins', protect, requireSuperAdmin, schoolController.getSchoolAdmins); // New
router.get('/super-admin/schools/:id/usage-stats', protect, requireSuperAdmin, schoolController.getSchoolUsageStats);

// Payment Management routes
router.get('/super-admin/schools/:id/payments', protect, requireSuperAdmin, paymentController.getSchoolPayments);
router.post('/super-admin/schools/:id/payments', protect, requireSuperAdmin, paymentController.createPayment);
router.put('/super-admin/schools/:id/payments/:paymentId', protect, requireSuperAdmin, paymentController.updatePayment);
router.delete('/super-admin/schools/:id/payments/:paymentId', protect, requireSuperAdmin, paymentController.deletePayment);
router.get('/super-admin/schools/:id/payments/:paymentId/invoice', protect, requireSuperAdmin, paymentController.downloadInvoice);
router.get('/super-admin/payments/summary', protect, requireSuperAdmin, paymentController.getPaymentsSummary);

// General Access (Teachers/Admins/Students/Public)
router.get('/public/schools', schoolController.getPublicSchools); // Public route for registration
router.get('/my-school', protect, schoolController.getMySchool);
router.get('/my-school/languages', protect, schoolController.getMySchoolLanguages);

// School Admin routes (Manage Own School)
// Uses 'protect' + simple role check (assuming req.user.role === 'admin')
const requireSchoolAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as school admin' });
    }
};

// Kept for backward compatibility or strict admin endpoints
router.get('/admin/school', protect, requireSchoolAdmin, schoolController.getMySchool);
router.put('/admin/school', protect, requireSchoolAdmin, schoolController.updateMySchool);

// Check availability route
router.post('/super-admin/schools/check-availability', protect, requireSuperAdmin, schoolController.checkSchoolAvailability);

module.exports = router;
