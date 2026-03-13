const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require('../controllers/cartController');

// 모든 장바구니 라우트는 로그인 필요
router.use(auth);

router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:itemId', updateItem);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);

module.exports = router;
