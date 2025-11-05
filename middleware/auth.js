const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Authorization header:', authHeader);
    console.log('Token:', token);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    
    if (!token) {
      console.log('❌ Token yo\'q!');
      return res.status(401).json({ error: 'Token topilmadi' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('❌ Token verify xatolik:', err.message);
        console.log('Error name:', err.name);
        return res.status(403).json({ error: 'Token noto\'g\'ri yoki muddati o\'tgan: ' + err.message });
      }
      
      console.log('✅ Token to\'g\'ri, user:', user);
      req.user = user;
      next();
    });
  } catch (err) {
    console.error('Auth middleware catch xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin huquqi kerak' });
  }
  next();
};

module.exports = { authenticateToken, isAdmin };