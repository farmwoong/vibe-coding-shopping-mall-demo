const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const SlotAvailability = require('../models/SlotAvailability');
const mongoose = require('mongoose');

/** 주문번호 생성: ORD-YYYYMMDD-HHmmss-랜덤4자 */
function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${y}${m}${d}-${h}${min}${sec}-${r}`;
}

/** 날짜만 비교용 00:00:00 UTC */
function dateOnly(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** 포트원 결제 검증 (imp_uid로 결제 정보 조회 후 금액·상태 확인) */
async function verifyPayment(impUid, expectedAmount) {
  const impKey = process.env.PORTONE_REST_API_KEY || process.env.IMP_KEY;
  const impSecret = process.env.PORTONE_REST_API_SECRET || process.env.REST_API_SECRET || process.env.IMP_SECRET;
  if (!impKey || !impSecret) {
    throw new Error('결제 검증을 위한 API 키가 설정되지 않았습니다. (PORTONE_REST_API_KEY, REST_API_SECRET)');
  }

  const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imp_key: impKey, imp_secret: impSecret }),
  });
  const tokenData = await tokenRes.json();
  if (tokenData.code !== 0 || !tokenData.response?.access_token) {
    throw new Error('결제 검증 토큰 발급에 실패했습니다.');
  }

  const payRes = await fetch(`https://api.iamport.kr/payments/${impUid}`, {
    headers: { Authorization: `Bearer ${tokenData.response.access_token}` },
  });
  const payData = await payRes.json();
  if (payData.code !== 0 || !payData.response) {
    const portOneMsg = payData.message || payData.response?.message || '';
    throw new Error(portOneMsg ? `결제 정보 조회 실패: ${portOneMsg}` : '결제 정보를 조회할 수 없습니다.');
  }

  const payment = payData.response;
  if (payment.status !== 'paid') {
    throw new Error(`결제가 완료되지 않았습니다. (상태: ${payment.status})`);
  }
  if (Math.abs(Number(payment.amount) - expectedAmount) > 1) {
    throw new Error('결제 금액이 주문 금액과 일치하지 않습니다.');
  }

  return payment;
}

/** 주문 생성 (장바구니 기반 아이템 + 이용일·시간). 슬롯 정원 검증 후 bookedCount 증가 */
async function createOrder(req, res) {
  try {
    const userId = req.user._id;
    const { items: rawItems, totalAmount, imp_uid: impUid, merchant_uid: merchantUid } = req.body;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: '주문 항목이 없습니다.' });
    }
    const total = Number(totalAmount);
    if (Number.isNaN(total) || total < 0) {
      return res.status(400).json({ error: '총 금액이 올바르지 않습니다.' });
    }

    // 1. 주문 중복 체크: 동일 일자에 같은 상품(체육관) 예약 여부
    const duplicateChecks = rawItems
      .filter((r) => r.productId && r.selectedDate && mongoose.Types.ObjectId.isValid(r.productId))
      .map((r) => {
        const d = new Date(r.selectedDate + 'T00:00:00.000Z');
        return { items: { $elemMatch: { product: r.productId, selectedDate: dateOnly(d) } } };
      });
    if (duplicateChecks.length > 0) {
      const existingDuplicate = await Order.findOne({
        user: userId,
        status: { $in: ['pending', 'paid'] },
        $or: duplicateChecks,
      });
      if (existingDuplicate) {
        return res.status(409).json({
          error: '이미 동일한 날짜에 같은 상품을 예약하셨습니다. 중복 예약은 불가합니다.',
        });
      }
    }

    // 2. 결제 검증 (imp_uid로 포트원 API 호출해 결제 완료·금액 확인)
    if (!impUid || typeof impUid !== 'string' || !impUid.trim()) {
      return res.status(400).json({ error: '결제 정보(imp_uid)가 필요합니다. 결제 후 다시 시도해 주세요.' });
    }
    const skipVerification = process.env.SKIP_PAYMENT_VERIFICATION === 'true';
    if (!skipVerification) {
      try {
        await verifyPayment(impUid, total);
      } catch (err) {
        // 테스트/일부 PG 결제 시 REST API에 imp_uid가 없을 수 있음
        // SKIP_PAYMENT_VERIFICATION=true 이거나 개발환경에서 "존재하지 않는 결제정보" 시 검증 생략
        const isDev = process.env.NODE_ENV !== 'production';
        const canSkipNotFound = err.message?.includes('존재하지 않는 결제정보');
        const skipNotFound = process.env.SKIP_PAYMENT_VERIFICATION === 'true' || (isDev && canSkipNotFound);
        if (canSkipNotFound && skipNotFound) {
          console.warn('[결제검증] 존재하지 않는 결제정보 - 검증 생략:', err.message);
        } else {
          throw err;
        }
      }
    }

    const orderItems = [];
    let computedTotal = 0;

    const DEFAULT_SLOT_TIME = '09:00';
    for (const row of rawItems) {
      const { productId, quantity, selectedDate, selectedTime } = row;
      if (!productId || !selectedDate || !quantity || quantity < 1) {
        return res.status(400).json({
          error: '각 항목에 productId, quantity, selectedDate가 필요합니다.',
        });
      }
      const slotTime = (selectedTime && String(selectedTime).trim()) || DEFAULT_SLOT_TIME;
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: '올바른 상품 ID가 아닙니다.' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: `상품을 찾을 수 없습니다: ${productId}` });
      }

      const date = new Date(selectedDate + 'T00:00:00.000Z');
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ error: 'selectedDate 형식은 YYYY-MM-DD여야 합니다.' });
      }

      let slot = await SlotAvailability.findOne({
        product: productId,
        date: dateOnly(date),
        time: slotTime,
      });
      if (!slot) {
        slot = await SlotAvailability.create({
          product: productId,
          date: dateOnly(date),
          time: slotTime,
          capacity: 99,
          bookedCount: 0,
        });
      }
      const remaining = (slot.capacity || 0) - (slot.bookedCount || 0);
      if (remaining < quantity) {
        return res.status(400).json({
          error: `잔여 정원이 부족합니다: ${product.name} ${selectedDate} (잔여 ${remaining}명)`,
        });
      }

      const unitPrice = product.price;
      const lineTotal = unitPrice * quantity;
      computedTotal += lineTotal;
      orderItems.push({
        product: productId,
        productName: product.name,
        quantity,
        unitPrice,
        selectedDate: dateOnly(date),
        selectedTime: slotTime,
      });
    }

    if (Math.abs(computedTotal - total) > 1) {
      return res.status(400).json({ error: '총 금액이 서버 계산과 일치하지 않습니다.' });
    }

    const orderNumber = (merchantUid && String(merchantUid).trim()) || generateOrderNumber();
    const order = await Order.create({
      user: userId,
      orderNumber,
      items: orderItems,
      totalAmount: computedTotal,
      status: 'paid', // 결제 검증 완료 후 생성
    });

    const defaultTime = DEFAULT_SLOT_TIME;
    for (const row of rawItems) {
      const date = new Date(row.selectedDate + 'T00:00:00.000Z');
      const t = (row.selectedTime && String(row.selectedTime).trim()) || defaultTime;
      const slotDate = dateOnly(date);
      await SlotAvailability.findOneAndUpdate(
        { product: row.productId, date: slotDate, time: t },
        {
          $setOnInsert: {
            product: row.productId,
            date: slotDate,
            time: t,
            capacity: 99,
          },
          $inc: { bookedCount: row.quantity },
        },
        { upsert: true, new: true }
      );
    }

    const populated = await Order.findById(order._id).populate('items.product');
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    if (err.code === 11000) {
      return res.status(409).json({ error: '주문번호 중복. 잠시 후 다시 시도해 주세요.' });
    }
    res.status(500).json({ error: err.message });
  }
}

/** 내 주문 목록 */
async function getMyOrders(req, res) {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('items.product');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** 주문 단건 조회 (본인만) */
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: '올바른 주문 ID가 아닙니다.' });
    }
    const order = await Order.findById(id).populate('items.product');
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.user_type === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: '본인의 주문만 조회할 수 있습니다.' });
    }
    res.json(order);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    res.status(500).json({ error: err.message });
  }
}

/** [관리자] 전체 주문 목록 */
async function adminGetAllOrders(req, res) {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    let orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('items.product');

    if (search && String(search).trim()) {
      const term = String(search).trim().toLowerCase();
      orders = orders.filter((o) => {
        if (o.orderNumber?.toLowerCase().includes(term)) return true;
        if (o.user?.name?.toLowerCase().includes(term)) return true;
        if (o.user?.email?.toLowerCase().includes(term)) return true;
        return false;
      });
    }

    res.json({ orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** [관리자] 주문 상태 변경 (취소, 수업 완료 등) */
async function adminUpdateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: '올바른 주문 ID가 아닙니다.' });
    }
    const validStatuses = ['cancelled', 'completed', 'paid'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'status는 cancelled, completed, paid 중 하나여야 합니다.' });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });

    if (status === 'paid') {
      if (order.status !== 'completed') {
        return res.status(400).json({ error: '수업 완료 상태의 주문만 수업 예정으로 돌릴 수 있습니다.' });
      }
    }

    if (status === 'cancelled') {
      if (order.status === 'cancelled') {
        return res.status(400).json({ error: '이미 취소된 주문입니다.' });
      }
      for (const item of order.items) {
        const slotDate = dateOnly(item.selectedDate);
        const slotTime = item.selectedTime || '09:00';
        await SlotAvailability.findOneAndUpdate(
          { product: item.product, date: slotDate, time: slotTime },
          { $inc: { bookedCount: -(item.quantity || 0) } }
        );
      }
    }

    if (status === 'completed') {
      if (order.status !== 'paid') {
        return res.status(400).json({ error: '결제완료 상태의 주문만 수업 완료로 변경할 수 있습니다.' });
      }
    }

    order.status = status;
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product');
    res.json(populated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    res.status(500).json({ error: err.message });
  }
}

/** [관리자] 회원 목록 + 회원별 예약 현황 */
async function adminGetMembersWithOrders(req, res) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.product');

    const members = users.map((u) => {
      const userOrders = orders.filter((o) => o.user.toString() === u._id.toString());
      return {
        user: { _id: u._id, name: u.name, email: u.email, user_type: u.user_type },
        orders: userOrders,
      };
    });

    res.json({ members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  adminGetAllOrders,
  adminUpdateOrderStatus,
  adminGetMembersWithOrders,
};
