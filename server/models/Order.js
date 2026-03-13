const mongoose = require('mongoose');

const orderStatusEnum = ['pending', 'paid', 'completed', 'cancelled', 'refunded'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedDate: {
      type: Date,
      required: true,
    },
    selectedTime: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: orderStatusEnum,
      default: 'pending',
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1 });
// orderNumber는 unique: true로 이미 인덱스 생성됨 → 중복 제거
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
