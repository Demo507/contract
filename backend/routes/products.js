import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { seller_address, title, description, price_tch8, image_url } = req.body;
  if (!seller_address || !title || !price_tch8) {
    return res.status(400).json({ error: 'seller_address, title, price_tch8 required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO products (seller_address, title, description, price_tch8, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [seller_address, title, description || '', price_tch8, image_url || '']
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    // This will print the precise column name causing the crash!
    console.error("❌ CRITICAL INSERT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});


router.get('/seller/:address', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE seller_address = $1 ORDER BY created_at DESC', [req.params.address]);
  res.json(rows);
});

export default router;