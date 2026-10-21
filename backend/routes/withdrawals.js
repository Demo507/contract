import express from 'express';
import { ethers } from 'ethers';
import { pool } from '../db.js';
import { wrap, lc, isAdminReq, requireAdmin } from '../middleware.js';
import { escrowAbi } from '../contracts/Escrow.abi.js';

const router = express.Router();
const CANCEL_WINDOW_HOURS = 24;
const EXPECTED_MIN_HOURS = 48;

function operatorEscrow() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
  return new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, wallet);
}

// User asks to cash out (TCH8 was already locked on-chain by requestRedemption)
router.post('/', wrap(async (req, res) => {
  const { wallet_address, amount, currency, account_details, redemption_id } = req.body || {};
  if (!wallet_address || !amount || !currency || !account_details) {
    return res.status(400).json({ error: 'wallet_address, amount, currency and account_details are required' });
  }
  const now = new Date();
  const cancelDeadline = new Date(now.getTime() + CANCEL_WINDOW_HOURS * 3600 * 1000);
  const expectedAt = new Date(now.getTime() + EXPECTED_MIN_HOURS * 3600 * 1000);
  const rid = redemption_id !== undefined && redemption_id !== null && redemption_id !== '' ? parseInt(redemption_id) : null;

  const { rows } = await pool.query(
    `INSERT INTO withdrawals (wallet_address, amount, currency, account_details, redemption_id, cancel_deadline, expected_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING id`,
    [lc(wallet_address), String(amount), String(currency).toUpperCase(), String(account_details).slice(0, 300), rid, cancelDeadline, expectedAt]
  );
  res.status(201).json({ id: rows[0].id, cancel_deadline: cancelDeadline, expected_at: expectedAt });
}));

// ?wallet=0x.. -> that wallet's requests (bank details masked). No wallet -> admin only (full details).
router.get('/', wrap(async (req, res) => {
  const admin = isAdminReq(req);
  const { wallet } = req.query;
  if (!wallet && !admin) return res.status(403).json({ error: 'Admin key required' });

  const result = wallet
    ? await pool.query('SELECT * FROM withdrawals WHERE LOWER(wallet_address) = $1 ORDER BY created_at DESC', [lc(wallet)])
    : await pool.query('SELECT * FROM withdrawals ORDER BY created_at DESC');

  const rows = admin
    ? result.rows
    : result.rows.map((r) => ({ ...r, account_details: '••••' + String(r.account_details).slice(-4) }));
  res.json(rows);
}));

// User cancels inside 24h -> locked tokens go back to the seller on-chain
router.post('/:id/cancel', wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await pool.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
  const w = rows[0];
  if (!w) return res.status(404).json({ error: 'Withdrawal not found' });
  if (lc(req.body?.wallet_address) !== lc(w.wallet_address)) return res.status(403).json({ error: 'Not your request' });
  if (w.status !== 'Pending') return res.status(400).json({ error: 'Already processed' });
  if (new Date() > new Date(w.cancel_deadline)) {
    return res.status(400).json({ error: 'The 24-hour cancellation window has expired.' });
  }
  if (w.redemption_id !== null) {
    const tx = await operatorEscrow().rejectRedemption(w.redemption_id); // returns tokens to the seller
    await tx.wait();
    await pool.query(`UPDATE redemptions SET status='Rejected', updated_at=now() WHERE redemption_id=$1`, [w.redemption_id]);
  }
  await pool.query(`UPDATE withdrawals SET status = 'Cancelled' WHERE id = $1`, [id]);
  res.json({ ok: true, status: 'Cancelled' });
}));

// Admin: payout was sent -> burn the locked tokens
router.post('/:id/complete', requireAdmin, wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await pool.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
  const w = rows[0];
  if (!w) return res.status(404).json({ error: 'Withdrawal not found' });
  if (w.status !== 'Pending') return res.status(400).json({ error: 'Already processed' });
  if (w.redemption_id !== null) {
    const tx = await operatorEscrow().confirmRedemption(w.redemption_id);
    await tx.wait();
    await pool.query(`UPDATE redemptions SET status='Completed', updated_at=now() WHERE redemption_id=$1`, [w.redemption_id]);
  }
  await pool.query(`UPDATE withdrawals SET status = 'Completed' WHERE id = $1`, [id]);
  res.json({ ok: true, status: 'Completed' });
}));

// Admin: payout failed -> give the tokens back
router.post('/:id/reject', requireAdmin, wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const { rows } = await pool.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
  const w = rows[0];
  if (!w) return res.status(404).json({ error: 'Withdrawal not found' });
  if (w.status !== 'Pending') return res.status(400).json({ error: 'Already processed' });
  if (w.redemption_id !== null) {
    const tx = await operatorEscrow().rejectRedemption(w.redemption_id);
    await tx.wait();
    await pool.query(`UPDATE redemptions SET status='Rejected', updated_at=now() WHERE redemption_id=$1`, [w.redemption_id]);
  }
  await pool.query(`UPDATE withdrawals SET status = 'Rejected' WHERE id = $1`, [id]);
  res.json({ ok: true, status: 'Rejected' });
}));

export default router;
