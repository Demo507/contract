import 'dotenv/config';
import { ethers } from 'ethers';
import { pool, initDb } from './db.js';

// Standard JavaScript imports matching your .js ABI files
import { escrowAbi } from './contracts/Escrow.abi.js';
import { tch8Abi } from './contracts/TCH8.Abi.js';

async function main() {
  await initDb();
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  // Set up both contracts using their respective environment variables
  const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, provider);
  const tch8 = new ethers.Contract(process.env.TCH8_ADDRESS, tch8Abi, provider);

  console.log('Indexer connected. Listening for Escrow events...');

  // This handles your successful purchases and logs them to the database
  escrow.on('OrderCreated', async (orderId, buyer, seller, amount, event) => {
    try {
      await pool.query(
        `INSERT INTO orders (order_id, buyer_address, seller_address, amount, status, tx_hash)
         VALUES ($1, $2, $3, $4, 'Paid', $5) ON CONFLICT (order_id) DO NOTHING`,
        [Number(orderId), buyer.toLowerCase(), seller.toLowerCase(), amount.toString(), event.log.transactionHash]
      );
      console.log(`📦 Order #${orderId} saved to database.`);
    } catch (err) {
      console.error('Error saving OrderCreated event:', err);
    }
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
      [Number(redemptionId), seller.toLowerCase(), amount.toString()]
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
