const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token topilmadi' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token noto\'g\'ri yoki muddati o\'tgan' });
    }
    req.user = user;  // ← TO'G'RIDAN-TO'G'RI! O'ZGARTIRMANG!
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin huquqi kerak' });
  }
  next();
};

module.exports = { authenticateToken, isAdmin };