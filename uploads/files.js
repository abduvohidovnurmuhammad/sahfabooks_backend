const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { uploadClientFiles } = require('../middleware/upload');
const router = express.Router();
const path = require('path');
const fs = require('fs');
let asadbek = 10
// GET /api/files - Barcha fayllar
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== FILES REQUEST ===');
    console.log('User:', req.user.username, 'Role:', req.user.role);

    let query;
    let params = [];

    if (req.user.role === 'client') {
      query = 'SELECT * FROM files WHERE client_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    } else {
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

// POST /api/files - Admin yangi fayl qo'shadi
router.post('/', authenticateToken, isAdmin, uploadClientFiles, async (req, res) => {
  try {
    console.log('=== ADMIN FAYL YARATISH ===');
    console.log('req.files:', req.files);
    
    const {
      client_id, title, description, cash_price, bank_price,
      show_price, stock, page_size, color_type, file_format
    } = req.body;

    if (!title || !client_id) {
      return res.status(400).json({ error: 'Sarlavha va mijoz majburiy!' });
    }

    if (!req.files || !req.files.cover_file || !req.files.content_file) {
      return res.status(400).json({ error: 'Ikkala fayl ham majburiy!' });
    }

    const cover_path = req.files.cover_file[0].path;
    const content_path = req.files.content_file[0].path;

    console.log('Muqova:', cover_path);
    console.log('Ichki:', content_path);

    const result = await db.query(
      `INSERT INTO files (client_id, title, description, cover_path, content_path,
       cash_price, bank_price, show_price, stock, page_size, color_type,
       file_format, uploaded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [client_id, title, description, cover_path, content_path,
       cash_price || 0, bank_price || 0, show_price || false,
       stock || 0, page_size, color_type, file_format, 'admin', 'approved']
    );

    console.log('✅ Admin fayl yaratildi:', result.rows[0].id);

    res.status(201).json({ success: true, file: result.rows[0] });

  } catch (err) {
    console.error('File yaratish xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// POST /api/files/client-upload - Client fayl yuklash
router.post('/client-upload', authenticateToken, uploadClientFiles, async (req, res) => {
  try {
    console.log('=== CLIENT FAYL YUKLASH ===');
    console.log('User:', req.user.username);
    console.log('Files:', req.files);
    
    const { title, description, quantity, page_size, color_type, file_format } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Sarlavha majburiy!' });
    }

    if (!req.files || !req.files.cover_file || !req.files.content_file) {
      return res.status(400).json({ error: 'Ikkala fayl ham majburiy!' });
    }

    const cover_path = req.files.cover_file[0].path;
    const content_path = req.files.content_file[0].path;

    console.log('Muqova:', cover_path);
    console.log('Ichki:', content_path);

    const result = await db.query(
      `INSERT INTO files (client_id, title, description, cover_path, content_path,
       page_size, color_type, file_format, stock, uploaded_by, status, show_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [req.user.id, title, description, cover_path, content_path,
       page_size, color_type, file_format, quantity || 0, 'client', 'pending', false]
    );

    console.log('✅ Client fayl yuklandi:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Fayllar yuklandi! Admin narx belgilaydi.',
      file: result.rows[0]
    });

  } catch (err) {
    console.error('Client upload xatolik:', err);
    if (req.files) {
      if (req.files.cover_file) fs.unlinkSync(req.files.cover_file[0].path);
      if (req.files.content_file) fs.unlinkSync(req.files.content_file[0].path);
    }
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// GET /api/files/:id/download/:fileType - Fayl yuklab olish
router.get('/:id/download/:fileType', authenticateToken, async (req, res) => {
  try {
    const { id, fileType } = req.params;
    
    console.log('=== DOWNLOAD ===');
    console.log('File ID:', id, 'Type:', fileType);
    
    if (fileType !== 'cover' && fileType !== 'content') {
      return res.status(400).json({ error: 'Noto\'g\'ri fayl turi!' });
    }
    
    let query = 'SELECT * FROM files WHERE id = $1';
    let params = [id];
    
    if (req.user.role === 'client') {
      query += ' AND client_id = $2';
      params.push(req.user.id);
    }
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi!' });
    }
    
    const file = result.rows[0];
    const filePath = fileType === 'cover' ? file.cover_path : file.content_path;
    
    if (!filePath) {
      return res.status(404).json({ error: 'Fayl yo\'li topilmadi!' });
    }
    
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Fayl diskda topilmadi!' });
    }
    
    const downloadName = `${file.title}_${fileType}${path.extname(filePath)}`;
    
    res.download(fullPath, downloadName, (err) => {
      if (err) {
        console.error('Download xatolik:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download xatolik' });
        }
      }
    });
    
  } catch (err) {
    console.error('Download xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// PUT /api/files/:id/approve - Tasdiqlash
router.put('/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { cash_price, bank_price } = req.body;
    
    if (!cash_price || !bank_price) {
      return res.status(400).json({ error: 'Ikkala narx majburiy!' });
    }
    
    const result = await db.query(
      `UPDATE files SET cash_price = $1, bank_price = $2, status = 'approved', show_price = true
       WHERE id = $3 RETURNING *`,
      [cash_price, bank_price, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi!' });
    }
    
    console.log('✅ Fayl tasdiqlandi:', result.rows[0].title);
    
    res.json({ success: true, message: 'Fayl tasdiqlandi!', file: result.rows[0] });
    
  } catch (err) {
    console.error('Approve xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// PUT /api/files/:id/reject - Rad etish
router.put('/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE files SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi!' });
    }
    
    console.log('✅ Fayl rad etildi:', result.rows[0].title);
    
    res.json({ success: true, message: 'Fayl rad etildi!', file: result.rows[0] });
    
  } catch (err) {
    console.error('Reject xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});
// DELETE /api/files/:id - O'chirish
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('=== DELETE FILE ===');
    console.log('File ID:', req.params.id, 'User:', req.user.username);
    
    const fileResult = await db.query('SELECT * FROM files WHERE id = $1', [req.params.id]);
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fayl topilmadi!' });
    }
    
    const file = fileResult.rows[0];
    
    if (req.user.role === 'client' && file.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Ruxsat yo\'q!' });
    }
    // Diskdan o'chirish
    if (file.cover_path && fs.existsSync(path.join(__dirname, '..', file.cover_path))) {
      fs.unlinkSync(path.join(__dirname, '..', file.cover_path));
      console.log('Cover o\'chirildi:', file.cover_path);
    }
    
    if (file.content_path && fs.existsSync(path.join(__dirname, '..', file.content_path))) {
      fs.unlinkSync(path.join(__dirname, '..', file.content_path));
      console.log('Content o\'chirildi:', file.content_path);
    }
    
    await db.query('DELETE FROM files WHERE id = $1', [req.params.id]);
    
    console.log('✅ Fayl o\'chirildi!');
    
    res.json({ success: true, message: 'Fayl o\'chirildi!' });
    
  } catch (err) {
    console.error('Delete xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

module.exports = router;