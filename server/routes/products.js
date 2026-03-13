const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productsController');
const {
  getAvailableDates,
  getAvailableSlots,
} = require('../controllers/availabilityController');

// 목록·상세 조회는 로그인/관리자 없이 누구나 접근 가능 (홈·상품 목록 공개)
router.get('/', getProducts);
router.get('/:id/available-dates', getAvailableDates);
router.get('/:id/available-slots', getAvailableSlots);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
