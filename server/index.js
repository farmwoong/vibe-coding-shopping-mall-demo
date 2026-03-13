require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
connectDB();

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'Shopping Mall API', status: 'ok' });
});

// API 라우트 (상품 목록·상세 GET은 인증 없이 공개)
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
