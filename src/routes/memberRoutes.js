const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  toggleFavorite,
  deleteMember,
  addMemberNote
} = require('../controllers/memberController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getMembers);
router.get('/:id', getMemberById);
router.post('/', requireRole('admin'), createMember);
router.put('/:id', requireRole('admin'), updateMember);
router.post('/:id/notes', addMemberNote);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', requireRole('admin'), deleteMember);

module.exports = router;
