const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/users - Barcha foydalanuvchilar (Faqat admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== USERS REQUEST ===');
    console.log('Admin:', req.user.username);

    const result = await db.query(
      'SELECT id, username, full_name, role, email, phone, organization_name, address, created_at FROM users ORDER BY created_at DESC'
    );

    console.log('Foydalanuvchilar soni:', result.rows.length);

    res.json({
      success: true,
      users: result.rows
    });

  } catch (err) {
    console.error('Users xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// GET /api/users/:id - Bitta foydalanuvchi
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Client faqat o'zini ko'rishi mumkin
    if (req.user.role === 'client' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    }

    const result = await db.query(
      'SELECT id, username, full_name, role, email, phone, organization_name, address, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    console.error('User xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// PUT /api/users/:id - Foydalanuvchini yangilash
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, organization_name, address, password } = req.body;

    // Client faqat o'zini yangilashi mumkin
    if (req.user.role === 'client' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    }

    let updateQuery = `
      UPDATE users 
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          organization_name = COALESCE($4, organization_name),
          address = COALESCE($5, address)
    `;
    let params = [full_name, email, phone, organization_name, address];

    // Agar parol yangilanayotgan bo'lsa
    if (password) {
      console.log('Parol yangilanmoqda...');
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = $6';
      params.push(hashedPassword);
      updateQuery += ' WHERE id = $7 RETURNING id, username, full_name, role, email, organization_name';
      params.push(id);
    } else {
      updateQuery += ' WHERE id = $6 RETURNING id, username, full_name, role, email, organization_name';
      params.push(id);
    }

    const result = await db.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    console.log('Foydalanuvchi yangilandi:', id);

    res.json({
      success: true,
      message: 'Foydalanuvchi muvaffaqiyatli yangilandi!',
      user: result.rows[0]
    });

  } catch (err) {
    console.error('User yangilash xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// DELETE /api/users/:id - Foydalanuvchini o'chirish (Faqat admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // O'zini o'chira olmaydi
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'O\'zingizni o\'chira olmaysiz!' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING username', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    console.log('Foydalanuvchi o\'chirildi:', result.rows[0].username);

    res.json({
      success: true,
      message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi!'
    });

  } catch (err) {
    console.error('User o\'chirish xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// GET /api/users/stats/summary - Statistika (Faqat admin)
router.get('/stats/summary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*) FROM users');
    const totalClients = await db.query('SELECT COUNT(*) FROM users WHERE role = \'client\'');
    const totalAdmins = await db.query('SELECT COUNT(*) FROM users WHERE role = \'admin\'');

    res.json({
      success: true,
      stats: {
        total_users: parseInt(totalUsers.rows[0].count),
        total_clients: parseInt(totalClients.rows[0].count),
        total_admins: parseInt(totalAdmins.rows[0].count)
      }
    });

  } catch (err) {
    console.error('Stats xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

module.exports = router;