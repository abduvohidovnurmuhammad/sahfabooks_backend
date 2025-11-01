const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();
const path = require('path');
const fs = require('fs');

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

// POST /api/files - Yangi fayl yaratish (Faqat admin - eski usul)
router.post('/', authenticateToken, isAdmin, upload.uploadSingle, async (req, res) => {
  try {
    console.log('=== YANGI FAYL YARATISH (ADMIN) ===');
    
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

    if (!title || !client_id) {
      return res.status(400).json({ error: 'Sarlavha va mijoz majburiy!' });
    }

    const file_path = req.file ? req.file.path : null;

    const result = await db.query(
      `INSERT INTO files (
        client_id,
        title,
        description,
        file_path,
        cash_price,
        bank_price,
        show_price,
        stock,
        page_size,
        color_type,
        file_format,
        uploaded_by,
        admin_notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        client_id,
        title,
        description,
        file_path,
        cash_price || 0,
        bank_price || 0,
        show_price || false,
        stock || 0,
        page_size,
        color_type,
        file_format,
        'admin',
        admin_notes,
        'approved'
      ]
    );

    console.log('Admin fayl yaratildi:', result.rows[0].id);

    res.status(201).json({
      success: true,
      file: result.rows[0]
    });

  } catch (err) {
    console.error('File yaratish xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// POST /api/files/client-upload - Mijoz ikkita fayl yuklash (YANGI!)
router.post('/client-upload', authenticateToken, upload.uploadClientFiles, async (req, res) => {
  try {
    console.log('=== CLIENT DUAL FILE UPLOAD ===');
    console.log('User:', req.user.username, 'Role:', req.user.role);
    console.log('Files received:', req.files);
    
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

    // Fayllarni tekshirish
    const cover_file_path = req.files && req.files['cover_file'] ? req.files['cover_file'][0].path : null;
    const content_file_path = req.files && req.files['content_file'] ? req.files['content_file'][0].path : null;

    if (!cover_file_path || !content_file_path) {
      return res.status(400).json({ 
        error: 'Ikkala fayl ham (muqova va tarkib) yuklash majburiy!' 
      });
    }

    console.log('Cover file:', cover_file_path);
    console.log('Content file:', content_file_path);

    // Database'ga saqlash
    const result = await db.query(
      `INSERT INTO files (
        client_id,
        title,
        description,
        cover_file_path,
        content_file_path,
        page_size,
        color_type,
        file_format,
        stock,
        uploaded_by,
        status,
        show_price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        req.user.id,
        title,
        description,
        cover_file_path,
        content_file_path,
        page_size,
        color_type,
        file_format,
        quantity || 0,
        'client',
        'pending',
        false
      ]
    );

    console.log('Mijoz ikkita fayl yuklandi:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Fayllar muvaffaqiyatli yuklandi! Admin narx belgilaydi.',
      file: result.rows[0]
    });

  } catch (err) {
    console.error('Client dual file upload xatolik:', err);
    
    // Xatolik bo'lsa, yuklangan fayllarni o'chirish
    if (req.files) {
      if (req.files['cover_file']) {
        fs.unlinkSync(req.files['cover_file'][0].path);
      }
      if (req.files['content_file']) {
        fs.unlinkSync(req.files['content_file'][0].path);
      }
    }
    
    res.status(500).json({ error: 'Server xatolik: ' + err.message });
  }
});

// GET /api/files/:id/download/:fileType - Fayl yuklab olish (cover yoki content)
router.get('/:id/download/:fileType', authenticateToken, async (req, res) => {
  try {
    const { id, fileType } = req.params;
    
    console.log('=== DOWNLOAD FILE ===');
    console.log('File ID:', id);
    console.log('File Type:', fileType);
    console.log('User:', req.user.username);
    
    // fileType tekshirish
    if (fileType !== 'cover' && fileType !== 'content') {
      return res.status(400).json({ error: 'Noto\'g\'ri fayl turi! (cover yoki content bo\'lishi kerak)' });
    }
    
    // Faylni database'dan topish
    let query = 'SELECT * FROM files WHERE id = $1';
    let params = [id];
    
    // Client faqat o'z faylini ko'rishi mumkin
    if (req.user.role === 'client') {
      query += ' AND client_id = $2';
      params.push(req.user.id);
    }
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi yoki sizga ruxsat yo\'q!' });
    }
    
    const file = result.rows[0];
    
    // Fayl yo'lini aniqlash
    const filePath = fileType === 'cover' ? file.cover_file_path : file.content_file_path;
    
    if (!filePath) {
      console.log(`${fileType} fayl yo'li mavjud emas!`);
      return res.status(404).json({ error: `${fileType === 'cover' ? 'Muqova' : 'Tarkib'} fayli topilmadi!` });
    }
    
    const fullFilePath = path.join(__dirname, '..', filePath);
    
    console.log('Full file path:', fullFilePath);
    
    // Fayl mavjudligini tekshirish
    if (!fs.existsSync(fullFilePath)) {
      console.log('Fayl disk\'da topilmadi!');
      return res.status(404).json({ error: 'Fayl disk\'da topilmadi!' });
    }
    
    console.log('Fayl yuborilmoqda...');
    
    // Fayl nomini yaratish
    const fileExtension = path.extname(filePath);
    const downloadName = `${file.title}_${fileType}${fileExtension}`;
    
    // Faylni yuborish
    res.download(fullFilePath, downloadName, (err) => {
      if (err) {
        console.error('Download xatolik:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download xatolik' });
        }
      } else {
        console.log('Download muvaffaqiyatli!');
      }
    });
    
  } catch (err) {
    console.error('Fayl yuklab olish xatolik:', err);
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

// DELETE /api/files/:id - Faylni o'chirish (Client o'z faylini, Admin barchasini)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.id;
    
    console.log('=== DELETE FILE ===');
    console.log('File ID:', fileId);
    console.log('User:', req.user.username, 'Role:', req.user.role);
    
    // Avval faylni topish
    const fileResult = await db.query('SELECT * FROM files WHERE id = $1', [fileId]);
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi!' });
    }
    
    const file = fileResult.rows[0];
    
    // ✅ RUXSAT TEKSHIRISH:
    // Client faqat o'z faylini o'chirishi mumkin
    // Admin barcha faylni o'chirishi mumkin
    if (req.user.role === 'client' && file.client_id !== req.user.id) {
      console.log('RUXSAT YO\'Q! File client_id:', file.client_id, 'User id:', req.user.id);
      return res.status(403).json({ error: 'Bu faylni o\'chirishga ruxsatingiz yo\'q!' });
    }
    
    console.log('Ruxsat berildi, faylni o\'chirish...');
    
    // Fayllarni diskdan o'chirish
    if (file.cover_file_path && fs.existsSync(path.join(__dirname, '..', file.cover_file_path))) {
      fs.unlinkSync(path.join(__dirname, '..', file.cover_file_path));
      console.log('Cover file o\'chirildi:', file.cover_file_path);
    }
    
    if (file.content_file_path && fs.existsSync(path.join(__dirname, '..', file.content_file_path))) {
      fs.unlinkSync(path.join(__dirname, '..', file.content_file_path));
      console.log('Content file o\'chirildi:', file.content_file_path);
    }
    
    // Eski file_path ham bo'lishi mumkin
    if (file.file_path && fs.existsSync(path.join(__dirname, '..', file.file_path))) {
      fs.unlinkSync(path.join(__dirname, '..', file.file_path));
      console.log('Old file o\'chirildi:', file.file_path);
    }
    
    // Database'dan o'chirish
    await db.query('DELETE FROM files WHERE id = $1', [fileId]);
    
    console.log('✅ Fayl muvaffaqiyatli o\'chirildi!');
    
    res.json({
      success: true,
      message: 'Fayl muvaffaqiyatli o\'chirildi!'
    });
    
  } catch (err) {
    console.error('Delete xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});
// YANGI - Ikkita fayl yuklash (muqova + content)


// YANGI - Cover yoki Content yuklab olish
router.get('/:id/download/:fileType', authenticateToken, async (req, res) => {
  try {
    const { id, fileType } = req.params;
    
    let query = 'SELECT * FROM files WHERE id = $1';
    if (req.user.role === 'client') {
      query += ' AND client_id = $2';
    }
    
    const params = req.user.role === 'client' ? [id, req.user.id] : [id];
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi' });
    }
    
    const file = result.rows[0];
    const filePath = fileType === 'cover' ? file.cover_file_path : file.content_file_path;
    
    if (!filePath) {
      return res.status(404).json({ error: 'Fayl yo\'li topilmadi' });
    }
    
    const path = require('path');
    const fs = require('fs');
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Fayl diskda topilmadi' });
    }
    
    res.download(fullPath);
    
  } catch (err) {
    console.error('Download xatolik:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;