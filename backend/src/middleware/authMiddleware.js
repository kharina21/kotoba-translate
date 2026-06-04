const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_kotoba_key_2026');
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại, xác thực thất bại.' });
      }

      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      res.status(401).json({ success: false, message: 'Xác thực thất bại, token không hợp lệ.' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Yêu cầu quyền truy cập, không tìm thấy token.' });
  }
};

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_kotoba_key_2026');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      console.error('Optional Auth Middleware Error:', error.message);
      // Don't fail the request, just proceed without req.user
    }
  }
  next();
};

module.exports = { protect, optionalProtect };
