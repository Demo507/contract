import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { getDb } from './db.js';

// This script listens to the Escrow contract and keeps the local
// database's `orders` and `redemptions` tables in sync with on-chain
// reality. Run it as a long-lived process (separate from the API
// server) — e.g. `npm run indexer` in its own terminal, or as a
// background service when you deploy for real.

const escrowAbi = JSON.parse(readFileSync('./contracts/Escrow.abi.json'));

async function main() {
  const db = await getDb();
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, provider);

  console.log('Indexer connected. Listening for Escrow events...');

  // ── Orders ──
  escrow.on('OrderCreated', async (orderId, buyer, seller, amount, event) => {
    console.log('OrderCreated', orderId.toString());
    await db.run(
      `INSERT INTO orders (order_id, buyer_address, seller_address, amount, status, tx_hash)
       VALUES (?, ?, ?, ?, 'Paid', ?)
       ON CONFLICT(order_id) DO NOTHING`,
      [Number(orderId), buyer, seller, amount.toString(), event.log.transactionHash]
    );
  });

  escrow.on('Delivered', async (orderId) => {
    console.log('Delivered', orderId.toString());
    await db.run(
      `UPDATE orders SET status = 'Delivered', updated_at = datetime('now') WHERE order_id = ?`,
      [Number(orderId)]
    );
  });

  escrow.on('Released', async (orderId) => {
    console.log('Released', orderId.toString());
    await db.run(
      `UPDATE orders SET status = 'Released', updated_at = datetime('now') WHERE order_id = ?`,
      [Number(orderId)]
    );
  });

  escrow.on('Refunded', async (orderId) => {
    console.log('Refunded', orderId.toString());
    await db.run(
      `UPDATE orders SET status = 'Refunded', updated_at = datetime('now') WHERE order_id = ?`,
      [Number(orderId)]
    );
  });

  escrow.on('Disputed', async (orderId) => {
    console.log('Disputed', orderId.toString());
    await db.run(
      `UPDATE orders SET status = 'Disputed', updated_at = datetime('now') WHERE order_id = ?`,
      [Number(orderId)]
    );
  });

  // ── Redemptions ──
  escrow.on('RedemptionRequested', async (redemptionId, seller, amount) => {
    console.log('RedemptionRequested', redemptionId.toString());
    await db.run(
      `INSERT INTO redemptions (redemption_id, seller_address, amount, status)
       VALUES (?, ?, ?, 'Pending')
       ON CONFLICT(redemption_id) DO NOTHING`,
      [Number(redemptionId), seller, amount.toString()]
    );
  });

  escrow.on('RedemptionCompleted', async (redemptionId) => {
    console.log('RedemptionCompleted', redemptionId.toString());
    await db.run(
      `UPDATE redemptions SET status = 'Completed', updated_at = datetime('now') WHERE redemption_id = ?`,
      [Number(redemptionId)]
    );
  });

  escrow.on('RedemptionRejected', async (redemptionId) => {
    console.log('RedemptionRejected', redemptionId.toString());
    await db.run(
      `UPDATE redemptions SET status = 'Rejected', updated_at = datetime('now') WHERE redemption_id = ?`,
      [Number(redemptionId)]
    );
  });
}

main().catch((err) => {
  console.error('Indexer crashed:', err);
  process.exit(1);
});