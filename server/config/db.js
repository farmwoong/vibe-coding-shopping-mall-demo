const mongoose = require('mongoose');

// Node.js v22+ Windows에서 querySrv ECONNREFUSED 방지 (DNS SRV 조회 실패 시)
try {
  require('node:dns').setServers(['1.1.1.1', '8.8.8.8']);
} catch (_) {}

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
