const express = require('express');
const router = express.Router();
const { getDailyVerse } = require('../controllers/verseController');

router.get('/today', getDailyVerse);
router.get('/', getDailyVerse);

module.exports = router;
