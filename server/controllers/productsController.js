const Product = require('../models/Product');

const CATEGORY_MAP = {
  fitness: ['헬스장', '크로스핏', '복싱'],
  wrestling: ['레슬링', '주짓수'],
  climbing: ['클라이밍'],
};

async function getProducts(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = limitParam === 0 ? 0 : (limitParam > 0 ? limitParam : 2); // 기본 2개, 0이면 전체
    const categoryParam = (req.query.category || '').toLowerCase();

    const filter = {};
    if (categoryParam && CATEGORY_MAP[categoryParam]) {
      filter.category = { $in: CATEGORY_MAP[categoryParam] };
    }

    const total = await Product.countDocuments(filter);

    if (limit === 0) {
      const products = await Product.find(filter).sort({ createdAt: -1 });
      return res.json({ products, total, page: 1, totalPages: 1 });
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ products, total, page, limit, totalPages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: '체육관을 찾을 수 없습니다.' });
    res.json(product);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    res.status(500).json({ error: err.message });
  }
}

async function createProduct(req, res) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors || {})
        .map((e) => e.message)
        .join(' ');
      return res.status(400).json({ error: message || err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: '이미 사용 중인 SKU입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: '체육관을 찾을 수 없습니다.' });
    res.json(product);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors || {})
        .map((e) => e.message)
        .join(' ');
      return res.status(400).json({ error: message || err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: '이미 사용 중인 SKU입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: '체육관을 찾을 수 없습니다.' });
    res.status(204).send();
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: '잘못된 ID입니다.' });
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
