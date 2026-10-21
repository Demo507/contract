import express from 'express';
import { pool } from '../db.js';
import { wrap, lc } from '../middleware.js';

const router = express.Router();

router.get('/', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  res.json(rows);
}));

router.get('/seller/:address', wrap(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE LOWER(seller_address) = $1 ORDER BY created_at DESC',
    [lc(req.params.address)]
  );
  res.json(rows);
}));

router.get('/:id', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [parseInt(req.params.id)]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

router.post('/', wrap(async (req, res) => {
  const { seller_address, title, description, price_tch8, image_url } = req.body || {};
  if (!seller_address || !title || price_tch8 === undefined || price_tch8 === '') {
    return res.status(400).json({ error: 'seller_address, title and price_tch8 are required' });
  }
  const price = Number(price_tch8);
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'price_tch8 must be a positive number' });
  }
  const { rows } = await pool.query(
    `INSERT INTO products (seller_address, title, description, price_tch8, image_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [lc(seller_address), String(title).slice(0, 120), String(description || '').slice(0, 1000), String(price), String(image_url || '').slice(0, 500)]
  );
  res.status(201).json({ id: rows[0].id });
}));

export default router;
