const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function getUsers(req, res) {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUserById(req, res) {
  try {
    if (req.params.id === 'me') {
      return res.status(404).json({ error: '현재 사용자 정보는 GET /api/users/me 와 Authorization 헤더를 사용하세요.' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    res.json(user);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    res.status(500).json({ error: err.message });
  }
}

async function createUser(req, res) {
  try {
    const { email, name, password, user_type, address } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      user_type: user_type || 'customer',
      address: address || '',
    });
    const result = user.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors || {})
        .map((e) => e.message)
        .join(' ');
      return res.status(400).json({ error: message || err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const update = { ...req.body };
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    res.json(user);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
}

/** [관리자] 회원 등급(user_type) 변경 */
async function adminUpdateUserType(req, res) {
  try {
    const { user_type } = req.body;
    if (!user_type || !['admin', 'customer'].includes(user_type)) {
      return res.status(400).json({ error: 'user_type은 admin 또는 customer여야 합니다.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { user_type },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    res.json(user);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    res.status(204).send();
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: '서버 설정 오류입니다.' });
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secret,
      { expiresIn }
    );
    const result = user.toObject();
    delete result.password;
    res.json({ message: '로그인 성공', token, user: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** 토큰으로 인증된 현재 유저 정보 반환 (auth 미들웨어 이후 req.user 사용) */
async function getMe(req, res) {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
  getMe,
  adminUpdateUserType,
};
