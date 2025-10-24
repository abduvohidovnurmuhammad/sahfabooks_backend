const express = require('express');
const db = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/orders - Barcha buyurtmalar (TO'LIQ MA'LUMOTLAR BILAN)
// GET /api/orders - Barcha buyurtmalar (TO'LIQ MA'LUMOTLAR BILAN)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== ORDERS REQUEST ===');
    console.log('User:', req.user.username, 'Role:', req.user.role);

    let query;
    let params = [];

    // Client faqat o'z buyurtmalarini ko'radi
    if (req.user.role === 'client') {
      query = `
        SELECT 
          o.id,
          o.client_id,
          o.status,
          o.payment_status,
          o.total_amount,
          o.delivery_date,
          o.delivery_address,
          o.notes,
          o.created_at,
          o.updated_at,
          u.username as client_username,
          u.organization_name,
          u.phone as client_phone,
          u.email as client_email
        FROM orders o
        LEFT JOIN users u ON o.client_id = u.id
        WHERE o.client_id = $1
        ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // Admin barcha buyurtmalarni ko'radi
      query = `
        SELECT 
          o.id,
          o.client_id,
          o.status,
          o.payment_status,
          o.total_amount,
          o.delivery_date,
          o.delivery_address,
          o.notes,
          o.created_at,
          o.updated_at,
          u.username as client_username,
          u.organization_name,
          u.phone as client_phone,
          u.email as client_email
        FROM orders o
        LEFT JOIN users u ON o.client_id = u.id
        ORDER BY o.created_at DESC
      `;
    }

    const ordersResult = await db.query(query, params);

    // Har bir buyurtma uchun items'ni alohida yuklash
    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await db.query(
        `SELECT 
          oi.id,
          oi.file_id,
          oi.quantity,
          oi.price,
          f.title as file_title,
          f.description as file_description,
          f.file_format,
          f.page_size,
          f.color_type,
          f.file_path
        FROM order_items oi
        LEFT JOIN files f ON oi.file_id = f.id
        WHERE oi.order_id = $1`,
        [order.id]
      );
      
      orders.push({
        ...order,
        items: itemsResult.rows
      });
    }

    console.log('Buyurtmalar soni:', orders.length);
    if (orders.length > 0) {
      console.log('Birinchi buyurtma items:', orders[0].items?.length || 0);
    }

    res.json({
      success: true,
      orders: orders
    });

  } catch (err) {
    console.error('Orders xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});
// GET /api/orders/:id - Bitta buyurtma (detallari bilan)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    let orderQuery = `
      SELECT 
        o.id,
        o.client_id,
        o.status,
        o.payment_status,
        o.total_amount,
        o.delivery_date,
        o.delivery_address,
        o.notes,
        o.created_at,
        o.updated_at,
        u.username as client_username,
        u.organization_name,
        u.phone as client_phone,
        u.email as client_email,
        u.address as client_address
      FROM orders o
      LEFT JOIN users u ON o.client_id = u.id
      WHERE o.id = $1
    `;
    let orderParams = [id];

    if (req.user.role === 'client') {
      orderQuery += ' AND o.client_id = $2';
      orderParams.push(req.user.id);
    }

    const orderResult = await db.query(orderQuery, orderParams);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Buyurtma topilmadi' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await db.query(
      `SELECT 
        oi.*,
        f.title,
        f.description,
        f.file_format,
        f.page_size,
        f.color_type,
        f.file_path
       FROM order_items oi
       LEFT JOIN files f ON oi.file_id = f.id
       WHERE oi.order_id = $1`,
      [id]
    );

    order.items = itemsResult.rows;

    res.json({
      success: true,
      order: order
    });

  } catch (err) {
    console.error('Order xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// POST /api/orders - Yangi buyurtma yaratish
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== YANGI BUYURTMA ===');

    const { items, delivery_address, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Buyurtma bo\'sh bo\'lishi mumkin emas!' });
    }

    await db.query('BEGIN');

    try {
      let totalAmount = 0;
      for (const item of items) {
        const fileResult = await db.query('SELECT cash_price FROM files WHERE id = $1', [item.file_id]);
        if (fileResult.rows.length === 0) {
          throw new Error(`Fayl topilmadi: ${item.file_id}`);
        }
        totalAmount += parseFloat(fileResult.rows[0].cash_price) * item.quantity;
      }

      const orderResult = await db.query(
        `INSERT INTO orders (client_id, status, payment_status, total_amount, delivery_address, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [req.user.id, 'pending', 'Pending', totalAmount, delivery_address, notes]
      );

      const order = orderResult.rows[0];

      for (const item of items) {
        const fileResult = await db.query('SELECT cash_price FROM files WHERE id = $1', [item.file_id]);
        const price = fileResult.rows[0].cash_price;

        await db.query(
          `INSERT INTO order_items (order_id, file_id, quantity, price) 
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.file_id, item.quantity, price]
        );
      }

      await db.query('COMMIT');

      console.log('Yangi buyurtma yaratildi:', order.id);

      res.status(201).json({
        success: true,
        message: 'Buyurtma muvaffaqiyatli yaratildi!',
        order: order
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Buyurtma yaratish xatolik:', err);
    res.status(500).json({ error: err.message || 'Server xatolik' });
  }
});

// PUT /api/orders/:id/status - Status o'zgartirish (Faqat admin)
router.put('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('=== STATUS O\'ZGARTIRISH ===');
    console.log('Order ID:', id);
    console.log('Yangi status:', status);

    const allowedStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Noto\'g\'ri status' });
    }

    const result = await db.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Buyurtma topilmadi' });
    }

    console.log('Status yangilandi:', id, '->', status);

    res.json({
      success: true,
      message: 'Status muvaffaqiyatli yangilandi!',
      order: result.rows[0]
    });

  } catch (err) {
    console.error('Status yangilash xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// PUT /api/orders/:id - Buyurtma ma'lumotlarini yangilash (Faqat admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status, delivery_date, notes } = req.body;

    const result = await db.query(
      `UPDATE orders 
       SET status = COALESCE($1, status),
           payment_status = COALESCE($2, payment_status),
           delivery_date = COALESCE($3, delivery_date),
           notes = COALESCE($4, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [status, payment_status, delivery_date, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Buyurtma topilmadi' });
    }

    console.log('Buyurtma yangilandi:', id);

    res.json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli yangilandi!',
      order: result.rows[0]
    });

  } catch (err) {
    console.error('Order yangilash xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});
// DELETE /api/orders/:id - Buyurtmani o'chirish (Faqat admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Buyurtma topilmadi' });
    }

    console.log('Buyurtma o\'chirildi:', id);

    res.json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli o\'chirildi!'
    });

  } catch (err) {
    console.error('Order o\'chirish xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

// GET /api/orders/stats/summary - Buyurtma statistikasi (Faqat admin)
router.get('/stats/summary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalOrders = await db.query('SELECT COUNT(*) FROM orders');
    const pendingOrders = await db.query('SELECT COUNT(*) FROM orders WHERE status = \'pending\'');
    const processingOrders = await db.query('SELECT COUNT(*) FROM orders WHERE status = \'processing\'');
    const completedOrders = await db.query('SELECT COUNT(*) FROM orders WHERE status = \'completed\'');
    const totalRevenue = await db.query('SELECT SUM(total_amount) FROM orders WHERE payment_status = \'Paid\'');

    res.json({
      success: true,
      stats: {
        total_orders: parseInt(totalOrders.rows[0].count),
        pending_orders: parseInt(pendingOrders.rows[0].count),
        processing_orders: parseInt(processingOrders.rows[0].count),
        completed_orders: parseInt(completedOrders.rows[0].count),
        total_revenue: parseFloat(totalRevenue.rows[0].sum || 0)
      }
    });

  } catch (err) {
    console.error('Stats xatolik:', err);
    res.status(500).json({ error: 'Server xatolik' });
  }
});

module.exports = router;