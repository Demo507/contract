import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { buyer, seller } = req.query;
  let result;
  if (buyer) result = await pool.query('SELECT * FROM orders WHERE buyer_address = $1 ORDER BY created_at DESC', [buyer]);
  else if (seller) result = await pool.query('SELECT * FROM orders WHERE seller_address = $1 ORDER BY created_at DESC', [seller]);
  else result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(result.rows);
});

router.get('/:orderId', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orders WHERE order_id = $1', [req.params.orderId]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.patch('/:orderId/link-product', async (req, res) => {
  const { product_id } = req.body;
  await pool.query('UPDATE orders SET product_id = $1 WHERE order_id = $2', [product_id, req.params.orderId]);
  res.json({ ok: true });
});

export default router;