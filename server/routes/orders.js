const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  adminGetAllOrders,
  adminUpdateOrderStatus,
  adminGetMembersWithOrders,
} = require('../controllers/ordersController');

router.use(auth);

router.get('/', getMyOrders);
router.get('/admin/list', requireAdmin, adminGetAllOrders);
router.get('/admin/members', requireAdmin, adminGetMembersWithOrders);
router.patch('/:id/status', requireAdmin, adminUpdateOrderStatus);
router.get('/:id', getOrderById);
router.post('/', createOrder);

module.exports = router;
