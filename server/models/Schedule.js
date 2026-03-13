const mongoose = require('mongoose');

/**
 * 체육관별 주간 반복 운영 시간표.
 * 요일(dayOfWeek) + 시간대(timeSlots) + 세션별 정원(capacity).
 */
const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: { type: String, default: '', trim: true },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: true }
);

const scheduleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    timeSlots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ product: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
