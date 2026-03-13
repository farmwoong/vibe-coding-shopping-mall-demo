const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
  getMe,
  adminUpdateUserType,
} = require('../controllers/usersController');

router.get('/', getUsers);
// /me는 반드시 /:id 보다 위에 두기 (그렇지 않으면 "me"가 id로 매칭됨)
router.get('/me', auth, getMe);
router.get('/:id', getUserById);
router.post('/', createUser);
router.post('/login', login);
router.put('/:id', updateUser);
router.patch('/:id/user-type', auth, requireAdmin, adminUpdateUserType);
router.delete('/:id', deleteUser);

module.exports = router;
