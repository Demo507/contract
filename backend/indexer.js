// OPTIONAL helper. The app already syncs orders from the chain after every action
// (POST /api/orders/:id/sync). This keeps the database fresh for actions made outside the site.
import 'dotenv/config';
import { ethers } from 'ethers';
import { pool, initDb } from './db.js';
import { escrowAbi } from './contracts/Escrow.abi.js';

const lc = (a) => String(a).toLowerCase();

async function setStatus(orderId, status) {
  await pool.query(`UPDATE orders SET status = $1, updated_at = now() WHERE order_id = $2`, [status, Number(orderId)]);
}

async function main() {
  await initDb();
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, provider);
  console.log('Indexer listening to Escrow events...');

  const safe = (fn) => async (...args) => {
    try { await fn(...args); } catch (e) { console.error('Indexer handler error:', e.message); }
  };

  escrow.on('OrderCreated', safe(async (orderId, buyer, seller, amount, event) => {
    await pool.query(
      `INSERT INTO orders (order_id, buyer_address, seller_address, amount, status, tx_hash)
       VALUES ($1, $2, $3, $4, 'Paid', $5) ON CONFLICT (order_id) DO NOTHING`,
      [Number(orderId), lc(buyer), lc(seller), amount.toString(), event.log.transactionHash]
    );
  }));
  escrow.on('Delivered', safe((id) => setStatus(id, 'Delivered')));
  escrow.on('Released', safe((id) => setStatus(id, 'Released')));
  escrow.on('Refunded', safe((id) => setStatus(id, 'Refunded')));
  escrow.on('Disputed', safe((id) => setStatus(id, 'Disputed')));

  escrow.on('RedemptionRequested', safe(async (rid, seller, amount) => {
    await pool.query(
      `INSERT INTO redemptions (redemption_id, seller_address, amount, status)
       VALUES ($1, $2, $3, 'Pending') ON CONFLICT (redemption_id) DO NOTHING`,
      [Number(rid), lc(seller), amount.toString()]
    );
  }));
  escrow.on('RedemptionCompleted', safe((rid) =>
    pool.query(`UPDATE redemptions SET status='Completed', updated_at=now() WHERE redemption_id=$1`, [Number(rid)])));
  escrow.on('RedemptionRejected', safe((rid) =>
    pool.query(`UPDATE redemptions SET status='Rejected', updated_at=now() WHERE redemption_id=$1`, [Number(rid)])));
}

main().catch((err) => {
  console.error('Indexer crashed:', err);
  process.exit(1);
});
