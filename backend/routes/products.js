import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// GET /api/products — list everything for sale
router.get('/', async (req, res) => {
  const db = await getDb();
  const products = await db.all('SELECT * FROM products ORDER BY created_at DESC');
  res.json(products);
});

// GET /api/products/:id — one product
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// POST /api/products — seller creates a listing (off-chain, no gas cost)
router.post('/', async (req, res) => {
  const { seller_address, title, description, price_tch8, image_url } = req.body;

  if (!seller_address || !title || !price_tch8) {
    return res.status(400).json({ error: 'seller_address, title, and price_tch8 are required' });
  }

  const db = await getDb();
  const result = await db.run(
    `INSERT INTO products (seller_address, title, description, price_tch8, image_url)
     VALUES (?, ?, ?, ?, ?)`,
    [seller_address, title, description || '', price_tch8, image_url || '']
  );

  res.status(201).json({ id: result.lastID });
});

// GET /api/products/seller/:address — one seller's listings
router.get('/seller/:address', async (req, res) => {
  const db = await getDb();
  const products = await db.all(
    'SELECT * FROM products WHERE seller_address = ? ORDER BY created_at DESC',
    [req.params.address]
  );
  res.json(products);
});

export default router;