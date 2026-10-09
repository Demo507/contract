import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.post('/connect', async (req, res) => {
  const { wallet_address, display_name, email, phone } = req.body;
  if (!wallet_address) return res.status(400).json({ error: 'wallet_address required' });

  await pool.query(
    `INSERT INTO users (wallet_address, display_name, email, phone) VALUES ($1, $2, $3, $4)
     ON CONFLICT (wallet_address) DO UPDATE SET
       display_name = COALESCE(EXCLUDED.display_name, users.display_name),
       email = COALESCE(EXCLUDED.email, users.email),
       phone = COALESCE(EXCLUDED.phone, users.phone)`,
    [wallet_address, display_name || null, email || null, phone || null]
  );

  const { rows } = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [wallet_address]);
  res.json(rows[0]);
});

router.get('/count', async (req, res) => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  res.json({ count: rows[0].count });
});

export default router;