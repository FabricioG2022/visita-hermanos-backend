const express = require('express');
const router = express.Router();
const { login, register, forgotPassword, getUsers, inviteUser, getMe, updateProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.get('/users', verifyToken, getUsers);
router.post('/invite', verifyToken, inviteUser);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
