const express = require('express');
const router = express.Router();
const { translateText } = require('../controllers/translationController');

// POST /api/translate
router.post('/', translateText);

module.exports = router;
