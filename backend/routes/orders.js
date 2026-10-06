import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// GET /api/orders?buyer=0x... or ?seller=0x...
router.get('/', async (req, res) => {
  const { buyer, seller } = req.query;
  const db = await getDb();

  let rows;
  if (buyer) {
    rows = await db.all(
      'SELECT * FROM orders WHERE buyer_address = ? ORDER BY created_at DESC',
      [buyer]
    );
  } else if (seller) {
    rows = await db.all(
      'SELECT * FROM orders WHERE seller_address = ? ORDER BY created_at DESC',
      [seller]
    );
  } else {
    rows = await db.all('SELECT * FROM orders ORDER BY created_at DESC');
  }

  res.json(rows);
});

// GET /api/orders/:orderId
router.get('/:orderId', async (req, res) => {
  const db = await getDb();
  const order = await db.get('SELECT * FROM orders WHERE order_id = ?', [req.params.orderId]);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

// PATCH /api/orders/:orderId/link-product
router.patch('/:orderId/link-product', async (req, res) => {
  const { product_id } = req.body;
  const db = await getDb();
  await db.run('UPDATE orders SET product_id = ? WHERE order_id = ?', [
    product_id,
    req.params.orderId,
  ]);
  res.json({ ok: true });
});

export default router;