import express from 'express';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { pool } from '../db.js';

const router = express.Router();
const escrowAbi = JSON.parse(readFileSync('./contracts/Escrow.abi.json'));

router.get('/', async (req, res) => {
  const { seller } = req.query;
  const result = seller
    ? await pool.query('SELECT * FROM redemptions WHERE seller_address = $1 ORDER BY created_at DESC', [seller])
    : await pool.query('SELECT * FROM redemptions ORDER BY created_at DESC');
  res.json(result.rows);
});

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