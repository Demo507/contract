import express from 'express';
import { pool } from '../db.js';
const router = express.Router();

// ========================================================
// 📩 1. POST: RECORD A NEW SUCCESSFUL BLOCKCHAIN ESCROW ORDER
// ========================================================
router.post('/', async (req, res) => {
  const { order_id, buyer_address, seller_address, amount, product_id, tx_hash } = req.body;

  // Basic validation check
  if (!order_id || !buyer_address || !seller_address || !amount || !tx_hash) {
    return res.status(400).json({ error: 'Missing critical transaction data parameters.' });
  }

  try {
    // Prevent duplicate logs by checking if the order_id or transaction hash already exists
    const existingCheck = await pool.query(
      'SELECT order_id FROM orders WHERE order_id = \$1 OR tx_hash = \$2',
      [parseInt(order_id), tx_hash]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'This transaction or order reference hash is already logged.' });
    }

    // Insert the verified transaction record into your PostgreSQL table
    const newOrder = await pool.query(
      `INSERT INTO orders (order_id, buyer_address, seller_address, amount, status, product_id, tx_hash)
       VALUES ($1, $2, $3, $4, 'Paid', $5, $6)
       RETURNING *`,
      [
        parseInt(order_id),
        buyer_address.toLowerCase(),
        seller_address.toLowerCase(),
        amount.toString(), // Stored as a string to preserve high-precision blockchain integers safely
        product_id ? parseInt(product_id) : null,
        tx_hash
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Escrow transaction successfully synchronized to ledger indices.',
      order: newOrder.rows[0]
    });
  } catch (err) {
    console.error('Failed indexing incoming blockchain order payload:', err);
    res.status(500).json({ error: 'Internal PostgreSQL storage cluster exception.' });
  }
});

// ========================================================
// 📢 2. GLOBAL BROADCAST FEED: Fetches all successful sales
// ========================================================
router.get('/broadcast', async (req, res) => {
  try {
    // 💡 Upgraded to LEFT JOIN to ensure orders NEVER disappear if a product is deleted
    const { rows } = await pool.query(`
      SELECT o.*, p.title as product_title, p.image_url 
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC 
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 📊 3. USER HISTORY FEED: Fetches logs for buyer OR seller
// ========================================================
router.get('/history/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // 💡 Upgraded to LEFT JOIN for security and added LOWER() sanitation to handle wallet queries robustly
    const { rows } = await pool.query(
      `SELECT o.*, p.title as product_title 
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       WHERE LOWER(o.buyer_address) = $1 OR LOWER(o.seller_address) = $1
       ORDER BY o.created_at DESC`,
      [walletAddress.toLowerCase()]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
