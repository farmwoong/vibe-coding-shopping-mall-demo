const Schedule = require('../models/Schedule');
const ClosedDate = require('../models/ClosedDate');
const SlotAvailability = require('../models/SlotAvailability');
const Product = require('../models/Product');
const mongoose = require('mongoose');

/** YYYY-MM-DD 문자열을 해당 날짜 00:00:00 UTC Date로 */
function parseDateOnly(dateStr) {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** 해당 날짜가 휴관일인지 */
async function isClosed(productId, date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  const closed = await ClosedDate.findOne({
    product: productId,
    date: { $gte: start, $lte: end },
  });
  return !!closed;
}

/** 체육관 예약 가능한 날짜 목록 (Schedule 요일 기준, 휴관일 제외) */
async function getAvailableDates(req, res) {
  try {
    const { id: productId } = req.params;
    const fromStr = req.query.from;
    const toStr = req.query.to;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: '올바른 체육관 ID가 아닙니다.' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: '체육관을 찾을 수 없습니다.' });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let from = fromStr ? parseDateOnly(fromStr) : today;
    let to = toStr ? parseDateOnly(toStr) : null;
    if (!from || Number.isNaN(from.getTime())) {
      return res.status(400).json({ error: 'from 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' });
    }
    if (!to) {
      to = new Date(from);
      to.setUTCDate(to.getUTCDate() + 30);
    }
    if (Number.isNaN(to.getTime()) || to < from) {
      return res.status(400).json({ error: 'to 날짜 형식이 올바르지 않거나 from 이후여야 합니다.' });
    }

    const schedules = await Schedule.find({ product: productId });
    const dayOfWeeks = new Set(schedules.map((s) => s.dayOfWeek));
    const dates = [];
    const cursor = new Date(from);
    const hasSchedule = schedules.length > 0;
    while (cursor <= to) {
      const dayOfWeek = cursor.getUTCDay();
      const inSchedule = hasSchedule ? dayOfWeeks.has(dayOfWeek) : true;
      if (inSchedule) {
        const closed = await isClosed(productId, cursor);
        if (!closed) {
          dates.push(cursor.toISOString().slice(0, 10));
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    res.json({ productId, dates });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    res.status(500).json({ error: err.message });
  }
}

/** 날짜별 예약 가능 여부·정원 (시간 없이 날짜 단위). time은 내부용 09:00 고정 */
const DEFAULT_SLOT_TIME = '09:00';

async function getAvailableSlots(req, res) {
  try {
    const { id: productId } = req.params;
    const dateStr = req.query.date;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: '올바른 체육관 ID가 아닙니다.' });
    }
    if (!dateStr) return res.status(400).json({ error: 'date 쿼리가 필요합니다. (YYYY-MM-DD)' });
    const date = parseDateOnly(dateStr);
    if (!date || Number.isNaN(date.getTime())) {
      return res.status(400).json({ error: 'date 형식이 올바르지 않습니다. (YYYY-MM-DD)' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: '체육관을 찾을 수 없습니다.' });

    const closed = await isClosed(productId, date);
    if (closed) return res.json({ productId, date: dateStr, slots: [] });

    const dayOfWeek = date.getUTCDay();
    const schedule = await Schedule.findOne({ product: productId, dayOfWeek });
    if (!schedule || !schedule.timeSlots || schedule.timeSlots.length === 0) {
      return res.json({ productId, date: dateStr, slots: [] });
    }

    const dayCapacity = schedule.timeSlots.reduce((sum, ts) => sum + (ts.capacity ?? 0), 0) || 1;
    let slot = await SlotAvailability.findOne({
      product: productId,
      date,
      time: DEFAULT_SLOT_TIME,
    });
    if (!slot) {
      slot = await SlotAvailability.create({
        product: productId,
        date,
        time: DEFAULT_SLOT_TIME,
        capacity: dayCapacity,
        bookedCount: 0,
      });
    }
    const remaining = Math.max(0, (slot.capacity || 0) - (slot.bookedCount || 0));
    res.json({
      productId,
      date: dateStr,
      slots: [{ time: slot.time, capacity: slot.capacity, bookedCount: slot.bookedCount, remaining }],
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAvailableDates,
  getAvailableSlots,
};
