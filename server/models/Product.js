const mongoose = require('mongoose');

const categoryEnum = [
  '헬스장',
  '크로스핏',
  '클라이밍',
  '주짓수',
  '레슬링',
  '복싱',
];

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: categoryEnum,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
