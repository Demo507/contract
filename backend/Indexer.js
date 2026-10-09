import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { pool, initDb } from './db.js';

const escrowAbi = JSON.parse(readFileSync('./contracts/Escrow.abi.json'));

async function main() {
  await initDb();
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, provider);

  console.log('Indexer connected. Listening for Escrow events...');

  escrow.on('OrderCreated', async (orderId, buyer, seller, amount, event) => {
    await pool.query(
      `INSERT INTO orders (order_id, buyer_address, seller_address, amount, status, tx_hash)
       VALUES ($1, $2, $3, $4, 'Paid', $5) ON CONFLICT (order_id) DO NOTHING`,
      [Number(orderId), buyer, seller, amount.toString(), event.log.transactionHash]
    );
  });

  escrow.on('Delivered', async (orderId) => {
    await pool.query(`UPDATE orders SET status = 'Delivered', updated_at = now() WHERE order_id = $1`, [Number(orderId)]);
  });

  escrow.on('Released', async (orderId) => {
    await pool.query(`UPDATE orders SET status = 'Released', updated_at = now() WHERE order_id = $1`, [Number(orderId)]);
  });

  escrow.on('Refunded', async (orderId) => {
    await pool.query(`UPDATE orders SET status = 'Refunded', updated_at = now() WHERE order_id = $1`, [Number(orderId)]);
  });

  escrow.on('Disputed', async (orderId) => {
    await pool.query(`UPDATE orders SET status = 'Disputed', updated_at = now() WHERE order_id = $1`, [Number(orderId)]);
  });

  escrow.on('RedemptionRequested', async (redemptionId, seller, amount) => {
    await pool.query(
      `INSERT INTO redemptions (redemption_id, seller_address, amount, status) VALUES ($1, $2, $3, 'Pending') ON CONFLICT (redemption_id) DO NOTHING`,
      [Number(redemptionId), seller, amount.toString()]
    );
  });

  escrow.on('RedemptionCompleted', async (redemptionId) => {
    await pool.query(`UPDATE redemptions SET status = 'Completed', updated_at = now() WHERE redemption_id = $1`, [Number(redemptionId)]);
  });

  escrow.on('RedemptionRejected', async (redemptionId) => {
    await pool.query(`UPDATE redemptions SET status = 'Rejected', updated_at = now() WHERE redemption_id = $1`, [Number(redemptionId)]);
  });
}

main().catch((err) => {
  console.error('Indexer crashed:', err);
  process.exit(1);
});