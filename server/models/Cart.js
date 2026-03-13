const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    selectedDate: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// 같은 사용자·같은 상품 조합으로 중복 담기 방지용 복합 인덱스 (선택)
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 }, { sparse: true });

module.exports = mongoose.model('Cart', cartSchema);
