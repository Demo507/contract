import express from 'express';
import { pool } from '../db.js';
import { wrap, lc } from '../middleware.js';

const router = express.Router();
const isOperator = (a) => a && lc(a) === lc(process.env.OPERATOR_WALLET);

// Anyone can file a complaint
router.post('/', wrap(async (req, res) => {
  const { wallet_address, order_id, subject, message } = req.body || {};
  if (!wallet_address || !subject || !message) {
    return res.status(400).json({ error: 'wallet_address, subject and message are required' });
  }
  const oid = order_id !== undefined && order_id !== '' && Number.isInteger(Number(order_id)) ? Number(order_id) : null;
  const { rows } = await pool.query(
    `INSERT INTO complaints (wallet_address, order_id, subject, message) VALUES ($1, $2, $3, $4) RETURNING id`,
    [lc(wallet_address), oid, String(subject).slice(0, 200), String(message).slice(0, 4000)]
  );
  res.status(201).json({ id: rows[0].id });
}));

// Only the operator wallet sees the whole list
router.get('/', wrap(async (req, res) => {
  if (!isOperator(req.query.requester_address)) return res.status(403).json({ error: 'Not authorized' });
  const { rows } = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
  res.json(rows);
}));

router.patch('/:id/status', wrap(async (req, res) => {
  const { requester_address, status } = req.body || {};
  if (!isOperator(requester_address)) return res.status(403).json({ error: 'Not authorized' });
  if (!['Open', 'Resolved'].includes(status)) return res.status(400).json({ error: 'Bad status' });
  await pool.query('UPDATE complaints SET status = $1 WHERE id = $2', [status, parseInt(req.params.id)]);
  res.json({ ok: true });
}));

export default router;
