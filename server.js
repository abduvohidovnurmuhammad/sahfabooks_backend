const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.static('.'));  // ← BURAGA QO'SHING
app.use('/uploads', express.static('uploads'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🎉 SAHFA BOOKS Backend ishlayapti!' });
});

// Database test
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'Database ulanishi ishlayapti!',
      time: result.rows[0].now 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});
// Routes
const authRoutes = require('./routes/auth');
const filesRoutes = require('./routes/files');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);

// Server ishga tushirish
app.listen(PORT, () => {
  console.log(`🚀 Server http://localhost:${PORT} da ishlayapti`);
});