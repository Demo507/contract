import express from 'express';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { pool } from '../db.js';

const router = express.Router();

// Safe dynamic resolution for loading the contract configuration metadata
let escrowAbi;
try {
  escrowAbi = JSON.parse(readFileSync('./contracts/Escrow.abi.json'));
} catch (err) {
  console.error("Critical: Escrow ABI file missing from configured directory paths:", err.message);
}

// ========================================================
// 🔍 1. GET: FETCH REDEMPTIONS LOG LIST (BY VENDOR OR TOTAL)
// ========================================================
router.get('/', async (req, res) => {
  const { seller } = req.query;

  try {
    // 💡 Added .toLowerCase() sanitation and robust error boundaries
    const result = seller
      ? await pool.query(
          'SELECT * FROM redemptions WHERE LOWER(seller_address) = \$1 ORDER BY created_at DESC', 
          [seller.toLowerCase()]
        )
      : await pool.query('SELECT * FROM redemptions ORDER BY created_at DESC');

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to query redemptions ledger tracking streams:', err);
    res.status(500).json({ error: 'Internal PostgreSQL data cluster retrieval error.' });
  }
});

// ========================================================
// ✅ 2. POST: OPERATOR CONFIRMS REDEMPTION (ON-CHAIN + DB SYNC)
// ========================================================
router.post('/:id/confirm', async (req, res) => {
  const redemptionId = parseInt(req.params.id);

  try {
    // Step A: Trigger cryptographic blockchain modification script
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
    const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, wallet);

    const tx = await escrow.confirmRedemption(redemptionId);
    await tx.wait(); // Wait for transaction confirmation on Sepolia

    // Step B: 💡 CRITICAL FIX - Synchronize status to local PostgreSQL database index table
    await pool.query(
      `UPDATE redemptions 
       SET status = 'Completed', updated_at = now() 
       WHERE redemption_id = $1`,
      [redemptionId]
    );

    res.json({ 
      success: true, 
      status: 'Completed', 
      txHash: tx.hash 
    });
  } catch (err) {
    console.error(`Execution failure processing contract confirmation on ID ${redemptionId}:`, err);
    res.status(500).json({ error: err.message || 'On-chain operator processing runtime exception.' });
  }
});

// ========================================================
// ❌ 3. POST: OPERATOR REJECTS REDEMPTION (ON-CHAIN + DB SYNC)
// ========================================================
router.post('/:id/reject', async (req, res) => {
  const redemptionId = parseInt(req.params.id);

  try {
    // Step A: Trigger cryptographic blockchain cancellation signature script
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
    const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, wallet);

    const tx = await escrow.rejectRedemption(redemptionId);
    await tx.wait();

    // Step B: 💡 CRITICAL FIX - Synchronize status reversal to local PostgreSQL database index table
    await pool.query(
      `UPDATE redemptions 
       SET status = 'Rejected', updated_at = now() 
       WHERE redemption_id = $1`,
      [redemptionId]
    );

    res.json({ 
      success: true, 
      status: 'Rejected', 
      txHash: tx.hash 
    });
  } catch (err) {
    console.error(`Execution failure processing contract rejection on ID ${redemptionId}:`, err);
    res.status(500).json({ error: err.message || 'On-chain operator processing runtime exception.' });
  }
});

export default router;
