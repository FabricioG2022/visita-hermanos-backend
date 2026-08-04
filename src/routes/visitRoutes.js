const express = require('express');
const router = express.Router();
const { getVisits, createVisit } = require('../controllers/visitController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getVisits);
router.post('/', createVisit);

module.exports = router;
