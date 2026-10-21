import express from 'express';
import { pool } from '../db.js';
import { wrap, lc } from '../middleware.js';

const router = express.Router();

router.get('/user/:address', wrap(async (req, res) => {
  const me = lc(req.params.address);
  const { rows } = await pool.query(
    `SELECT amount, buyer_address, seller_address, created_at FROM orders
     WHERE LOWER(buyer_address) = $1 OR LOWER(seller_address) = $1`, [me]);

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
  let daily = 0, monthly = 0, yearly = 0, bought = 0, sold = 0;

  for (const o of rows) {
    const d = new Date(o.created_at);
    const amt = Number(o.amount || 0) / 1e6; // base units -> TCH8
    if (d >= dayAgo) daily += amt;
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthly += amt;
    if (d.getFullYear() === now.getFullYear()) yearly += amt;
    if (lc(o.buyer_address) === me) bought++;
    if (lc(o.seller_address) === me) sold++;
  }
  res.json({
    analytics: { dailyVolume: daily, monthlyVolume: monthly, yearlyVolume: yearly },
    summary: { itemsBoughtCount: bought, itemsSoldCount: sold },
  });
}));

export default router;
