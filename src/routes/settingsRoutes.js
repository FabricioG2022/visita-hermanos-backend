const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.use(verifyToken);

router.get('/', getSettings);
router.put('/', requireRole('admin'), updateSettings);

module.exports = router;
