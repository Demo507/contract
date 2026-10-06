import express from 'express';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { getDb } from '../db.js';

const router = express.Router();
const escrowAbi = JSON.parse(readFileSync('./contracts/Escrow.abi.json'));

// GET /api/redemptions?seller=0x...
router.get('/', async (req, res) => {
  const { seller } = req.query;
  const db = await getDb();

  const rows = seller
    ? await db.all('SELECT * FROM redemptions WHERE seller_address = ? ORDER BY created_at DESC', [seller])
    : await db.all('SELECT * FROM redemptions ORDER BY created_at DESC');

  res.json(rows);
});

// POST /api/redemptions/:id/confirm — ADMIN ACTION. In a real system,
// only called after your backend verifies the real payout succeeded.
router.post('/:id/confirm', async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
    const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, wallet);

    const tx = await escrow.confirmRedemption(req.params.id);
    await tx.wait();

    res.json({ ok: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/redemptions/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
    const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, wallet);

    const tx = await escrow.rejectRedemption(req.params.id);
    await tx.wait();

    res.json({ ok: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;