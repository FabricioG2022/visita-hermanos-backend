const express = require('express');
const router = express.Router();
const {
  getAppointments,
  createAppointment,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);

module.exports = router;
