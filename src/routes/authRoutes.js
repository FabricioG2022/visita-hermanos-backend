const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, forgotPassword, getUsers, inviteUser, deleteUser, toggleUserStatus, getMe, updateProfile } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { validateStringTypes } = require('../middleware/sanitizeMiddleware');

// Rate limiter específico para Login (máximo 15 intentos por IP cada 15 minutos)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesión desde esta IP. Por favor espera 15 minutos.' }
});

// Endpoint liviano para pre-calentamiento del backend (despertar container Render)
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Backend awake', timestamp: Date.now() });
});

router.post('/login', authLimiter, validateStringTypes('email', 'password'), login);
router.post('/forgot-password', validateStringTypes('email'), forgotPassword);
router.get('/users', verifyToken, requireRole('admin'), getUsers);
router.post('/invite', verifyToken, requireRole('admin'), validateStringTypes('name', 'email', 'password', 'role'), inviteUser);
router.put('/users/:id/status', verifyToken, requireRole('admin'), toggleUserStatus);
router.delete('/users/:id', verifyToken, requireRole('admin'), deleteUser);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, validateStringTypes('name', 'newPassword'), updateProfile);

module.exports = router;
