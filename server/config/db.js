const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-mall';
    const conn = await mongoose.connect(mongoUrl);
    console.log(`MongoDB 연결됨: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB 연결 실패:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
