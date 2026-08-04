const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/stats', getDashboardStats);

module.exports = router;
