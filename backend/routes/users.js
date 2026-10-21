import express from 'express';
import crypto from 'crypto';
import { verifyMessage } from 'viem';
import { pool } from '../db.js';
import { wrap, lc } from '../middleware.js';

const router = express.Router();

// Optional contact details (name/email/phone)
router.post('/connect', wrap(async (req, res) => {
  const { wallet_address, display_name, email, phone } = req.body || {};
  if (!wallet_address) return res.status(400).json({ error: 'wallet_address required' });
  await pool.query(
    `INSERT INTO users (wallet_address, display_name, email, phone) VALUES ($1, $2, $3, $4)
     ON CONFLICT (wallet_address) DO UPDATE SET
       display_name = COALESCE(EXCLUDED.display_name, users.display_name),
       email = COALESCE(EXCLUDED.email, users.email),
       phone = COALESCE(EXCLUDED.phone, users.phone)`,
    [lc(wallet_address), display_name || null, email || null, phone || null]
  );
  res.json({ ok: true });
}));

router.get('/count', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  res.json({ count: rows[0].count });
}));

// Login step 1: ask for a challenge
router.post('/nonce', wrap(async (req, res) => {
  const { wallet_address } = req.body || {};
  if (!wallet_address) return res.status(400).json({ error: 'wallet_address required' });
  const addr = lc(wallet_address);
  const nonce =
    `Welcome to TCH8 Marketplace!\n\nSign this message to log in. It is free and does not cost gas.\n\n` +
    `Wallet: ${addr}\nChallenge: ${crypto.randomBytes(16).toString('hex')}`;
  await pool.query(
    `INSERT INTO users (wallet_address, nonce) VALUES ($1, $2)
     ON CONFLICT (wallet_address) DO UPDATE SET nonce = EXCLUDED.nonce`,
    [addr, nonce]
  );
  res.json({ nonce });
}));

// Login step 2: check the signature
router.post('/verify', wrap(async (req, res) => {
  const { wallet_address, signature } = req.body || {};
  if (!wallet_address || !signature) {
    return res.status(400).json({ error: 'wallet_address and signature are required' });
  }
  const addr = lc(wallet_address);
  const { rows } = await pool.query('SELECT nonce FROM users WHERE wallet_address = $1', [addr]);
  const nonce = rows[0]?.nonce;
  if (!nonce) return res.status(404).json({ error: 'No login challenge found. Please try again.' });

  let valid = false;
  try {
    valid = await verifyMessage({ address: addr, message: nonce, signature });
  } catch {
    valid = false;
  }
  if (!valid) return res.status(401).json({ error: 'Signature does not match this wallet.' });

  await pool.query('UPDATE users SET nonce = NULL WHERE wallet_address = $1', [addr]); // one-time use
  res.json({ success: true, wallet_address: addr });
}));

router.put('/profile/:address', wrap(async (req, res) => {
  const { display_name, email, phone, date_of_birth, country } = req.body || {};
  if (!display_name || !email) return res.status(400).json({ error: 'display_name and email required' });
  const { rowCount } = await pool.query(
    `UPDATE users SET display_name=$1, email=$2, phone=$3, date_of_birth=$4, country=$5, is_profile_complete=TRUE
     WHERE wallet_address=$6`,
    [display_name, email, phone || null, date_of_birth || null, country || null, lc(req.params.address)]
  );
  if (!rowCount) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
}));

export default router;
