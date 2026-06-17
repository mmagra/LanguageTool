const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');
const requireSchoolActive = require('../middleware/requireSchoolActive');
const requireSchoolValid = require('../middleware/requireSchoolValid');

router.use(protect);
router.use(requireSchoolActive);
router.use(requireSchoolValid);
router.use(authorize('teacher'));

router.post('/start', sessionController.startSession);
router.post('/end', sessionController.endSession);
router.get('/active', sessionController.getActiveSession);

module.exports = router;
