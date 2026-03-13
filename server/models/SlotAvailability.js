const mongoose = require('mongoose');

/**
 * 체육관별 날짜·시간대별 정원/잔여.
 * 예약 시 bookedCount 증가, 취소 시 감소.
 * date는 날짜만 사용 (00:00:00 UTC 기준 저장 권장).
 */
const slotAvailabilitySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

slotAvailabilitySchema.index({ product: 1, date: 1, time: 1 }, { unique: true });
slotAvailabilitySchema.index({ date: 1 });

module.exports = mongoose.model('SlotAvailability', slotAvailabilitySchema);
