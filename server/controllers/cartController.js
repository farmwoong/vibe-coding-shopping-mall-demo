const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

/** 현재 로그인 사용자의 장바구니 조회 (상품 정보 populate) */
async function getCart(req, res) {
  try {
    const userId = req.user._id;
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** 장바구니에 상품 추가 (같은 상품+같은 날짜면 수량 합산) */
async function addItem(req, res) {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1, selectedDate } = req.body;
    if (!productId) {
      return res.status(400).json({ error: '상품 ID(productId)가 필요합니다.' });
    }
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const dateStr = selectedDate && String(selectedDate).trim() ? String(selectedDate).trim() : '';
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: '올바른 상품 ID가 아닙니다.' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    const existing = cart.items.find(
      (item) =>
        item.product &&
        item.product.toString() === productId &&
        (item.selectedDate || '') === dateStr
    );
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty, selectedDate: dateStr });
    }
    await cart.save();
    const updated = await Cart.findById(cart._id).populate('items.product');
    res.status(201).json(updated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: '잘못된 ID입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
}

/** 장바구니 항목 수량/날짜 변경 */
async function updateItem(req, res) {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity, selectedDate } = req.body;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: '올바른 항목 ID가 아닙니다.' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: '장바구니가 비어 있습니다.' });
    }
    const item = cart.items.find((i) => i._id && i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ error: '장바구니에 해당 항목이 없습니다.' });
    }
    if (quantity !== undefined && quantity !== null) {
      const qty = parseInt(quantity, 10);
      if (Number.isNaN(qty) || qty < 0) {
        return res.status(400).json({ error: '수량은 0 이상의 숫자여야 합니다.' });
      }
      if (qty === 0) {
        cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
      } else {
        item.quantity = qty;
      }
    }
    if (selectedDate !== undefined && selectedDate !== null) {
      item.selectedDate = String(selectedDate).trim();
    }
    await cart.save();
    const updated = await Cart.findById(cart._id).populate('items.product');
    res.json(updated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: '잘못된 ID입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
}

/** 장바구니에서 항목 제거 */
async function removeItem(req, res) {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: '올바른 항목 ID가 아닙니다.' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: '장바구니가 비어 있습니다.' });
    }
    const itemIndex = cart.items.findIndex((i) => i._id && i._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: '장바구니에 해당 항목이 없습니다.' });
    }
    cart.items.splice(itemIndex, 1);
    await cart.save();
    const updated = await Cart.findById(cart._id).populate('items.product');
    res.json(updated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: '잘못된 ID입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
}

/** 장바구니 비우기 */
async function clearCart(req, res) {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      const empty = await Cart.create({ user: userId, items: [] });
      return res.json(empty);
    }
    cart.items = [];
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
