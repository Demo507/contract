import express from 'express';
import { pool } from '../db.js';

const router = express.Router();
const CANCEL_WINDOW_HOURS = 24;
const EXPECTED_MIN_HOURS = 48;

// ========================================================
// 📩 1. POST: SUBMIT A NEW FIAT EXCHANGE WITHDRAWAL
// ========================================================
router.post('/', async (req, res) => {
  const { wallet_address, amount, currency, account_details } = req.body;
  
  if (!wallet_address || !amount || !currency || !account_details) {
    return res.status(400).json({ error: 'wallet_address, amount, currency, and account_details are required' });
  }

  try {
    const now = new Date();
    const cancelDeadline = new Date(now.getTime() + CANCEL_WINDOW_HOURS * 3600 * 1000);
    const expectedAt = new Date(now.getTime() + EXPECTED_MIN_HOURS * 3600 * 1000);

    // Enforce LOWERCASE strings on the address to prevent database mismatch loops
    const safeAddress = wallet_address.toLowerCase();

    const { rows } = await pool.query(
      `INSERT INTO withdrawals (wallet_address, amount, currency, account_details, cancel_deadline, expected_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending') 
       RETURNING id`,
      [safeAddress, amount.toString(), currency.toUpperCase(), account_details, cancelDeadline, expectedAt]
    );

    res.status(201).json({ 
      id: rows[0].id, 
      cancel_deadline: cancelDeadline, 
      expected_at: expectedAt 
    });
  } catch (err) {
    console.error('Database failure creating withdrawal registry entry:', err);
    res.status(500).json({ error: 'Internal database storage cluster exception.' });
  }
});

// ========================================================
// 🔍 2. GET: FETCH USER ENTRIES (OR MASTER LEDGER LIST)
// ========================================================
router.get('/', async (req, res) => {
  const { wallet } = req.query;

  try {
    // 💡 Sanitized to LOWER() to handle multi-platform case shifts smoothly
    const result = wallet
      ? await pool.query('SELECT * FROM withdrawals WHERE LOWER(wallet_address) = \$1 ORDER BY created_at DESC', [wallet.toLowerCase()])
      : await pool.query('SELECT * FROM withdrawals ORDER BY created_at DESC');
      
    res.json(result.rows);
  } catch (err) {
    console.error('Failed retrieving withdrawal records array:', err);
    res.status(500).json({ error: 'Failed getting cashout history ledger items.' });
  }
});

// ========================================================
// 🛑 3. POST: GRACEFULLY CANCEL A RUNNING TRANSACTION WITHIN TIME WINDOW
// ========================================================
router.post('/:id/cancel', async (req, res) => {
  const withdrawalId = req.params.id;

  try {
    const { rows } = await pool.query('SELECT * FROM withdrawals WHERE id = \$1', [withdrawalId]);
    const w = rows[0];
    
    if (!w) return res.status(404).json({ error: 'Withdrawal request reference not found' });
    if (w.status !== 'Pending') return res.status(400).json({ error: 'Request already processed or modified' });
    
    // Check if the current timeframe has slipped past the allowance limits
    if (new Date() > new Date(w.cancel_deadline)) {
      return res.status(400).json({ error: 'The 24-hour cancellation period window has expired.' });
    }

    await pool.query(`UPDATE withdrawals SET status = 'Cancelled' WHERE id = $1`, [withdrawalId]);
    res.json({ ok: true, status: 'Cancelled' });
  } catch (err) {
    console.error('Failed modifying target row inside transaction parameters:', err);
    res.status(500).json({ error: 'Failed executing cancellation script update.' });
  }
});

export default router;
