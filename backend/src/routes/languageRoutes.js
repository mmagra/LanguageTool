const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

// Public/System routes (Protected by auth but available to all users - actually needs to be public for Login page localization)
router.get('/system/languages', languageController.getAllLanguages);

// Super Admin routes
router.get('/super-admin/languages', protect, requireSuperAdmin, languageController.getLanguagesAdmin);
router.post('/super-admin/languages', protect, requireSuperAdmin, languageController.addLanguage);
router.put('/super-admin/languages/:id', protect, requireSuperAdmin, languageController.updateLanguage);
router.patch('/super-admin/languages/:id/toggle', protect, requireSuperAdmin, languageController.toggleLanguage);
router.delete('/super-admin/languages/:id', protect, requireSuperAdmin, languageController.deleteLanguage);

module.exports = router;
