const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getRequests,
  createRequest,
  updateRequestStatus,
  getContactLogs,
  createContactLog
} = require('../controllers/messageController');

router.use(verifyToken);

// Avisos
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Solicitudes
router.get('/requests', getRequests);
router.post('/requests', createRequest);
router.patch('/requests/:id/status', updateRequestStatus);

// Historial de contactos
router.get('/logs', getContactLogs);
router.post('/logs', createContactLog);

module.exports = router;
