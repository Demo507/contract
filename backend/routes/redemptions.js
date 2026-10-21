import express from 'express';
import { ethers } from 'ethers';
import { pool } from '../db.js';
import { wrap, lc, requireAdmin } from '../middleware.js';
import { escrowAbi } from '../contracts/Escrow.abi.js';

const router = express.Router();

function operatorEscrow() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
  return new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, wallet);
}

router.get('/', wrap(async (req, res) => {
  const { seller } = req.query;
  const result = seller
    ? await pool.query('SELECT * FROM redemptions WHERE LOWER(seller_address) = $1 ORDER BY created_at DESC', [lc(seller)])
    : await pool.query('SELECT * FROM redemptions ORDER BY created_at DESC');
  res.json(result.rows);
}));

// Admin-only: these move real (test) money, so they need the ADMIN_KEY header.
router.post('/:id/confirm', requireAdmin, wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const tx = await operatorEscrow().confirmRedemption(id);
  await tx.wait();
  await pool.query(`UPDATE redemptions SET status='Completed', updated_at=now() WHERE redemption_id=$1`, [id]);
  res.json({ ok: true, txHash: tx.hash });
}));

router.post('/:id/reject', requireAdmin, wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const tx = await operatorEscrow().rejectRedemption(id);
  await tx.wait();
  await pool.query(`UPDATE redemptions SET status='Rejected', updated_at=now() WHERE redemption_id=$1`, [id]);
  res.json({ ok: true, txHash: tx.hash });
}));

export default router;
