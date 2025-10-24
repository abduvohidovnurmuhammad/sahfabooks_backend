const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload'); // ← SHU QATORNI QO'SHING!
const router = express.Router();

// GET /api/files - Barcha fayllar (authentication kerak)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== FILES REQUEST ===');
    console.log('User:', req.user.username, 'Role:', req.user.role);

    let query;
    let params = [];

    // Agar client bo'lsa - faqat o'z fayllarini ko'radi
    if (req.user.role === 'client') {
      query = 'SELECT * FROM files WHERE client_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    } else {
      // Admin - barcha fayllarni ko'radi
      query = 'SELECT f.*, u.username as client_username, u.organization_name FROM files f LEFT JOIN users u ON f.client_id = u.id ORDER BY f.created_at DESC';
    }

    const result = await db.query(query, params);

    console.log('Fayllar soni:', result.rows.length);

    res.json({
      success: true,
      files: result.rows
    });

  } catch (err) {
    console.error('Files xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// GET /api/files/:id - Bitta fayl
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query = 'SELECT f.*, u.username as client_username FROM files f LEFT JOIN users u ON f.client_id = u.id WHERE f.id = $1';
    
    // Client faqat o'z faylini ko'rishi mumkin
    if (req.user.role === 'client') {
      query += ' AND f.client_id = $2';
      const result = await db.query(query, [id, req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Fayl topilmadi' });
      }
      
      return res.json({ success: true, file: result.rows[0] });
    }

    // Admin barcha faylni ko'rishi mumkin
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi' });
    }

    res.json({ success: true, file: result.rows[0] });

  } catch (err) {
    console.error('File xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// POST /api/files - Yangi fayl yaratish va file yuklash (Faqat admin)
router.post('/', authenticateToken, isAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('=== YANGI FAYL YARATISH ===');
    
    const { 
      client_id, 
      title, 
      description, 
      cash_price, 
      bank_price, 
      show_price, 
      stock,
      page_size,
      color_type,
      file_format,
      admin_notes
    } = req.body;

    if (!client_id || !title) {
      return res.status(400).json({ error: 'client_id va title majburiy!' });
    }
// Yuklangan faylning yo'li
const file_path = req.file ? req.file.path : null;

const result = await db.query(
  `INSERT INTO files (client_id, title, description, file_path, cash_price, bank_price, show_price, stock, page_size, color_type, file_format, admin_notes) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
   RETURNING *`,
  [client_id, title, description, file_path, cash_price, bank_price, show_price || false, stock || 0, page_size, color_type, file_format, admin_notes]
);

    console.log('Yangi fayl yaratildi:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Fayl muvaffaqiyatli yaratildi!',
      file: result.rows[0]
    });

  } catch (err) {
    console.error('Fayl yaratish xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// PUT /api/files/:id - Faylni yangilash (Faqat admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      cash_price, 
      bank_price, 
      show_price, 
      stock,
      page_size,
      color_type,
      admin_notes
    } = req.body;

    const result = await db.query(
      `UPDATE files 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           cash_price = COALESCE($3, cash_price),
           bank_price = COALESCE($4, bank_price),
           show_price = COALESCE($5, show_price),
           stock = COALESCE($6, stock),
           page_size = COALESCE($7, page_size),
           color_type = COALESCE($8, color_type),
           admin_notes = COALESCE($9, admin_notes)
       WHERE id = $10
       RETURNING *`,
      [title, description, cash_price, bank_price, show_price, stock, page_size, color_type, admin_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi' });
    }

    console.log('Fayl yangilandi:', id);

    res.json({
      success: true,
      message: 'Fayl muvaffaqiyatli yangilandi!',
      file: result.rows[0]
    });

  } catch (err) {
    console.error('Fayl yangilash xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// DELETE /api/files/:id - Faylni o'chirish (Faqat admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM files WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi' });
    }

    console.log('Fayl o\'chirildi:', id);

    res.json({
      success: true,
      message: 'Fayl muvaffaqiyatli o\'chirildi!'
    });

  } catch (err) {
    console.error('Fayl o\'chirish xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});
// GET /api/files/:id/download - Faylni yuklab olish
// GET /api/files/:id/download - Faylni yuklab olish
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.id;
    console.log('=== DOWNLOAD REQUEST ===');
    console.log('File ID:', fileId);
    console.log('User:', req.user);
    
    // Faylni database'dan topish
    const result = await db.query(
      'SELECT * FROM files WHERE id = $1',
      [fileId]
    );
    
    if (result.rows.length === 0) {
      console.log('Fayl topilmadi!');
      return res.status(404).json({ error: 'Fayl topilmadi!' });
    }
    
    const file = result.rows[0];
    console.log('Fayl topildi:', file.title);
    console.log('File path:', file.file_path);
    
    // Agar client bo'lsa, faqat o'z fayllarini yuklab olishi mumkin
if (req.user.role === 'client' && file.client_id !== req.user.id) {
  console.log('Ruxsat yo\'q! Client ID:', file.client_id, 'User ID:', req.user.id);
  return res.status(403).json({ error: 'Ruxsat yo\'q!' });
}
    
    // Fayl yo'lini tekshirish
    if (!file.file_path) {
      console.log('File path mavjud emas!');
      return res.status(404).json({ error: 'Fayl yo\'li topilmadi!' });
    }
    
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', file.file_path);
    
    console.log('Full file path:', filePath);
    
    // Fayl mavjudligini tekshirish
    if (!fs.existsSync(filePath)) {
      console.log('Fayl disk\'da topilmadi!');
      return res.status(404).json({ error: 'Fayl disk\'da topilmadi!' });
    }
    
    console.log('Fayl yuborilmoqda...');
    
    // Faylni yuborish
    res.download(filePath, file.title + path.extname(file.file_path), (err) => {
      if (err) {
        console.error('Download xatolik:', err);
        res.status(500).json({ error: 'Download xatolik' });
      } else {
        console.log('Download muvaffaqiyatli!');
      }
    });
    
  } catch (err) {
    console.error('Fayl yuklab olish xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});
// POST /api/files/client-upload - Mijoz fayl yuklash
router.post('/client-upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('=== CLIENT FILE UPLOAD ===');
    console.log('User:', req.user.username, 'Role:', req.user.role);
    
    const { 
      title, 
      description, 
      quantity,
      page_size,
      color_type,
      file_format
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Sarlavha majburiy!' });
    }

    const file_path = req.file ? req.file.path : null;

    if (!file_path) {
      return res.status(400).json({ error: 'Fayl yuklanmadi!' });
    }

    const result = await db.query(
      `INSERT INTO files (
        client_id, 
        title, 
        description, 
        file_path, 
        page_size, 
        color_type, 
        file_format, 
        stock,
        uploaded_by,
        status,
        show_price
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        req.user.id,
        title, 
        description, 
        file_path, 
        page_size, 
        color_type, 
        file_format,
        quantity || 0,
        'client',
        'pending',
        false
      ]
    );

    console.log('Mijoz fayl yuklandi:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Fayl muvaffaqiyatli yuklandi! Admin narx belgilaydi.',
      file: result.rows[0]
    });

  } catch (err) {
    console.error('Client file upload xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});
// PUT /api/files/:id/approve - Faylni tasdiqlash va narx qo'yish
router.put('/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const fileId = req.params.id;
    const { cash_price, bank_price } = req.body;
    
    console.log('=== APPROVE FILE ===');
    console.log('File ID:', fileId);
    console.log('Cash Price:', cash_price);
    console.log('Bank Price:', bank_price);
    
    if (!cash_price || !bank_price) {
      return res.status(400).json({ error: 'Ikkala narx majburiy!' });
    }
    
    // Database'da yangilash
    const result = await db.query(
      `UPDATE files 
       SET cash_price = $1, 
           bank_price = $2, 
           status = 'approved', 
           show_price = true 
       WHERE id = $3 
       RETURNING *`,
      [cash_price, bank_price, fileId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi!' });
    }
    
    console.log('Fayl tasdiqlandi:', result.rows[0].title);
    
    res.json({
      success: true,
      message: 'Fayl muvaffaqiyatli tasdiqlandi!',
      file: result.rows[0]
    });
    
  } catch (err) {
    console.error('Approve xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// PUT /api/files/:id/reject - Faylni rad etish
router.put('/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const fileId = req.params.id;
    
    console.log('=== REJECT FILE ===');
    console.log('File ID:', fileId);
    
    // Database'da yangilash
    const result = await db.query(
      `UPDATE files 
       SET status = 'rejected' 
       WHERE id = $1 
       RETURNING *`,
      [fileId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi!' });
    }
    
    console.log('Fayl rad etildi:', result.rows[0].title);
    
    res.json({
      success: true,
      message: 'Fayl rad etildi!',
      file: result.rows[0]
    });
    
  } catch (err) {
    console.error('Reject xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

module.exports = router;