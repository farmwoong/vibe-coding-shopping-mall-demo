const mongoose = require('mongoose');

/**
 * 체육관별 휴관일 (공휴일, 임시 휴관 등).
 * date는 날짜만 사용 (시간 무시).
 */
const closedDateSchema = new mongoose.Schema(
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
    reason: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

closedDateSchema.index({ product: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ClosedDate', closedDateSchema);
