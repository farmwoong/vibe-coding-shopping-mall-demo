/**
 * auth 미들웨어 이후 사용. req.user가 admin인지 확인합니다.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({ error: '관리자만 접근할 수 있습니다.' });
  }
  next();
}

module.exports = requireAdmin;
