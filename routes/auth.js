const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  try {
    console.log('=== LOGIN REQUEST KELDI ===');
    console.log('Request body:', req.body);
    
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('Username yoki parol yo\'q!');
      return res.status(400).json({ error: 'Username va parol majburiy!' });
    }

    console.log('Username:', username);
    console.log('Password uzunligi:', password.length);

    // Foydalanuvchini topish
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    console.log('Database query natija:', result.rows.length, 'user topildi');

    if (result.rows.length === 0) {
      console.log('User topilmadi!');
      return res.status(401).json({ error: 'Username yoki parol noto\'g\'ri' });
    }

    const user = result.rows[0];
    console.log('=== USER MA\'LUMOTLARI ===');
    console.log('User topildi:', user.username);
    console.log('User role:', user.role);
    console.log('Database parol hash:', user.password);
    console.log('Kiritilgan parol:', password);
    console.log('=======================');

    // Parolni tekshirish
    console.log('Parol taqqoslash boshlanmoqda...');
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('bcrypt.compare natija:', validPassword);

    if (!validPassword) {
      console.log('❌ PAROL NOTO\'G\'RI!');
      return res.status(401).json({ error: 'Username yoki parol noto\'g\'ri' });
    }

    console.log('✅ PAROL TO\'G\'RI! Token yaratilmoqda...');

    // JWT token yaratish
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log('Token yaratildi!');
    console.log('=== LOGIN MUVAFFAQIYATLI ===');

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        organization_name: user.organization_name
      }
    });

  } catch (err) {
    console.error('=== LOGIN XATOLIK ===');
    console.error('Xatolik:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: 'Server xatolik' });
  }
});


// REGISTER
router.post('/register', async (req, res) => {
  try {
    console.log('=== REGISTER REQUEST KELDI ===');
    
    const { username, password, full_name, email, phone, organization_name, address } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Username, parol va to\'liq ism majburiy!' });
    }

    // Username borligini tekshirish
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Bu username allaqachon ishlatilmoqda' });
    }

    // Parolni hash qilish
    console.log('Parol hash qilinmoqda...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Parol hash qilindi!');

    // Yangi foydalanuvchi yaratish
    const result = await db.query(
      `INSERT INTO users (username, password, full_name, email, phone, organization_name, address, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, username, full_name, role, email, organization_name`,
      [username, hashedPassword, full_name, email, phone, organization_name, address, 'client']
    );

    const newUser = result.rows[0];
    console.log('Yangi user yaratildi:', newUser.username);

    // JWT token yaratish
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log('=== REGISTER MUVAFFAQIYATLI ===');

    res.status(201).json({
      success: true,
      message: 'Ro\'yxatdan o\'tish muvaffaqiyatli!',
      token,
      user: newUser
    });

  } catch (err) {
    console.error('=== REGISTER XATOLIK ===');
    console.error('Xatolik:', err.message);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

module.exports = router;