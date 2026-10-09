import express from 'express';
import { pool } from '../db.js';

const router = express.Router();
const OPERATOR_WALLET = (process.env.OPERATOR_WALLET || '').toLowerCase();

function isOperator(address) {
  return address && address.toLowerCase() === OPERATOR_WALLET;
}

router.post('/', async (req, res) => {
  const { wallet_address, order_id, subject, message } = req.body;
  if (!wallet_address || !subject || !message) {
    return res.status(400).json({ error: 'wallet_address, subject, message required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO complaints (wallet_address, order_id, subject, message) VALUES ($1, $2, $3, $4) RETURNING id`,
    [wallet_address, order_id || null, subject, message]
  );
  res.status(201).json({ id: rows[0].id });
});

router.get('/', async (req, res) => {
  const { requester_address } = req.query;
  if (!isOperator(requester_address)) return res.status(403).json({ error: 'Not authorized' });
  const { rows } = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
  res.json(rows);
});

router.patch('/:id/status', async (req, res) => {
  const { requester_address, status } = req.body;
  if (!isOperator(requester_address)) return res.status(403).json({ error: 'Not authorized' });
  await pool.query('UPDATE complaints SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ ok: true });
});

export default router;