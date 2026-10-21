import express from 'express';
import { ethers } from 'ethers';
import { pool } from '../db.js';
import { wrap, lc } from '../middleware.js';
import { escrowAbi } from '../contracts/Escrow.abi.js';

const router = express.Router();
const STATUS = ['None', 'Paid', 'Delivered', 'Released', 'Refunded', 'Disputed'];
const JOIN = `LEFT JOIN products p ON o.product_id = p.id`;
const COLS = `o.*, p.title AS product_title, p.price_tch8 AS product_price`;

// GET /api/orders?buyer=0x..  or  ?seller=0x..
router.get('/', wrap(async (req, res) => {
  const { buyer, seller } = req.query;
  let result;
  if (buyer) {
    result = await pool.query(`SELECT ${COLS} FROM orders o ${JOIN} WHERE LOWER(o.buyer_address) = $1 ORDER BY o.created_at DESC`, [lc(buyer)]);
  } else if (seller) {
    result = await pool.query(`SELECT ${COLS} FROM orders o ${JOIN} WHERE LOWER(o.seller_address) = $1 ORDER BY o.created_at DESC`, [lc(seller)]);
  } else {
    result = await pool.query(`SELECT ${COLS} FROM orders o ${JOIN} ORDER BY o.created_at DESC LIMIT 100`);
  }
  res.json(result.rows);
}));

// Public activity feed
router.get('/broadcast', wrap(async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLS}, p.image_url FROM orders o ${JOIN} ORDER BY o.created_at DESC LIMIT 50`);
  res.json(rows);
}));

router.get('/history/:wallet', wrap(async (req, res) => {
  const w = lc(req.params.wallet);
  const { rows } = await pool.query(
    `SELECT ${COLS} FROM orders o ${JOIN}
     WHERE LOWER(o.buyer_address) = $1 OR LOWER(o.seller_address) = $1
     ORDER BY o.created_at DESC`, [w]);
  res.json(rows);
}));

// The frontend calls this after every successful on-chain action. The backend READS THE CHAIN
// itself (so the client cannot lie) and stores the real status. Works even if the indexer is off.
router.post('/:orderId/sync', wrap(async (req, res) => {
  const id = parseInt(req.params.orderId);
  if (!Number.isInteger(id) || id < 0) return res.status(400).json({ error: 'Bad order id' });
  const { product_id, tx_hash } = req.body || {};

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const escrow = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowAbi, provider);
  const o = await escrow.orders(id);
  if (o.buyer === ethers.ZeroAddress) return res.status(404).json({ error: 'Order not found on-chain' });

  const status = STATUS[Number(o.status)] || 'Paid';
  const amount = o.amount.toString();

  await pool.query(
    `INSERT INTO orders (order_id, buyer_address, seller_address, amount, status, product_id, tx_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (order_id) DO UPDATE SET
       status = EXCLUDED.status,
       product_id = COALESCE(EXCLUDED.product_id, orders.product_id),
       tx_hash = COALESCE(orders.tx_hash, EXCLUDED.tx_hash),
       updated_at = now()`,
    [id, lc(o.buyer), lc(o.seller), amount, status, product_id ? parseInt(product_id) : null, tx_hash || null]
  );
  res.json({ ok: true, order_id: id, status });
}));

router.get('/:orderId', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orders WHERE order_id = $1', [parseInt(req.params.orderId)]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

export default router;
