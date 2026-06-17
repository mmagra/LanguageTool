const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const paymentController = require('../controllers/paymentController');
const stripeController = require('../controllers/stripeController');
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Super Admin routes
router.get('/super-admin/schools', protect, requireSuperAdmin, schoolController.getAllSchools);
router.get('/super-admin/schools/:id', protect, requireSuperAdmin, schoolController.getSchoolById);
router.post('/super-admin/schools', protect, requireSuperAdmin, schoolController.createSchool);
router.put('/super-admin/schools/:id', protect, requireSuperAdmin, schoolController.updateSchool);
router.delete('/super-admin/schools/:id', protect, requireSuperAdmin, schoolController.deleteSchool);
router.post('/super-admin/schools/:id/logo', protect, requireSuperAdmin, schoolController.updateSchoolLogo);
router.post('/super-admin/schools/:id/access', protect, requireSuperAdmin, schoolController.grantAccess);
router.get('/super-admin/schools/:id/admins', protect, requireSuperAdmin, schoolController.getSchoolAdmins); // New
router.get('/super-admin/schools/:id/usage-stats', protect, requireSuperAdmin, schoolController.getSchoolUsageStats);
router.get('/super-admin/schools/:id/usage-history', protect, requireSuperAdmin, schoolController.getUsageHistory);
router.post('/super-admin/schools/:id/usage-reset', protect, requireSuperAdmin, schoolController.manualUsageReset);

// Payment Management routes
router.get('/super-admin/schools/:id/payments', protect, requireSuperAdmin, paymentController.getSchoolPayments);
router.post('/super-admin/schools/:id/payments', protect, requireSuperAdmin, paymentLimiter, paymentController.createPayment);
router.put('/super-admin/schools/:id/payments/:paymentId', protect, requireSuperAdmin, paymentLimiter, paymentController.updatePayment);
router.delete('/super-admin/schools/:id/payments/:paymentId', protect, requireSuperAdmin, paymentLimiter, paymentController.deletePayment);
router.get('/super-admin/schools/:id/payments/:paymentId/invoice', protect, requireSuperAdmin, paymentController.downloadInvoice);
router.get('/super-admin/payments/summary', protect, requireSuperAdmin, paymentController.getPaymentsSummary);
router.get('/super-admin/billing/overview', protect, requireSuperAdmin, paymentController.getBillingOverview);

// Stripe Subscription routes (Super Admin manages on the school's behalf)
router.post('/super-admin/schools/:id/subscription/checkout', protect, requireSuperAdmin, paymentLimiter, stripeController.createCheckoutSession);
router.get('/super-admin/schools/:id/subscription', protect, requireSuperAdmin, stripeController.getSubscription);
router.post('/super-admin/schools/:id/subscription/cancel', protect, requireSuperAdmin, stripeController.cancelSubscription);
router.post('/super-admin/schools/:id/subscription/resume', protect, requireSuperAdmin, stripeController.resumeSubscription);

// General Access (Teachers/Admins/Students/Public)
router.get('/public/schools', schoolController.getPublicSchools); // Public route for registration
router.get('/my-school', protect, schoolController.getMySchool);
router.get('/my-school/languages', protect, schoolController.getMySchoolLanguages);
router.get('/my-school/payments', protect, paymentController.getMyPayments);

// School Admin routes (Manage Own School)
// Uses 'protect' + simple role check (assuming req.user.role === 'admin')
const requireSchoolAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as school admin' });
    }
};

// Kept for backward compatibility or strict admin endpoints
router.get('/admin/school', protect, requireSchoolAdmin, schoolController.getMySchool);
router.put('/admin/school', protect, requireSchoolAdmin, schoolController.updateMySchool);

// School admin self-service billing: see the latest payment link + start checkout
router.get('/my-school/payment-link', protect, requireSchoolAdmin, stripeController.getMyPaymentLink);
router.post('/my-school/subscription/checkout', protect, requireSchoolAdmin, stripeController.createMyCheckoutSession);

// Check availability route
router.post('/super-admin/schools/check-availability', protect, requireSuperAdmin, schoolController.checkSchoolAvailability);

module.exports = router;
