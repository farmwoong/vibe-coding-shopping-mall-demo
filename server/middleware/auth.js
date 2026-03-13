const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authorization: Bearer <token> 헤더에서 토큰을 검증하고 req.user에 유저 정보를 담습니다.
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: '토큰이 필요합니다.' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: '서버 설정 오류입니다.' });
    }
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = auth;
