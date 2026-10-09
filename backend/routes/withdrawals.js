import express from 'express';
import { pool } from '../db.js';

const router = express.Router();
const CANCEL_WINDOW_HOURS = 24;
const EXPECTED_MIN_HOURS = 48;

router.post('/', async (req, res) => {
  const { wallet_address, amount, currency, account_details } = req.body;
  if (!wallet_address || !amount || !currency || !account_details) {
    return res.status(400).json({ error: 'wallet_address, amount, currency, account_details required' });
  }
  const now = new Date();
  const cancelDeadline = new Date(now.getTime() + CANCEL_WINDOW_HOURS * 3600 * 1000);
  const expectedAt = new Date(now.getTime() + EXPECTED_MIN_HOURS * 3600 * 1000);

  const { rows } = await pool.query(
    `INSERT INTO withdrawals (wallet_address, amount, currency, account_details, cancel_deadline, expected_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [wallet_address, amount, currency, account_details, cancelDeadline, expectedAt]
  );
  res.status(201).json({ id: rows[0].id, cancel_deadline: cancelDeadline, expected_at: expectedAt });
});

router.get('/', async (req, res) => {
  const { wallet } = req.query;
  const result = wallet
    ? await pool.query('SELECT * FROM withdrawals WHERE wallet_address = $1 ORDER BY created_at DESC', [wallet])
    : await pool.query('SELECT * FROM withdrawals ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/:id/cancel', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM withdrawals WHERE id = $1', [req.params.id]);
  const w = rows[0];
  if (!w) return res.status(404).json({ error: 'Not found' });
  if (w.status !== 'Pending') return res.status(400).json({ error: 'Already processed' });
  if (new Date() > new Date(w.cancel_deadline)) return res.status(400).json({ error: 'Cancel window has passed' });

  await pool.query(`UPDATE withdrawals SET status = 'Cancelled' WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

export default router;