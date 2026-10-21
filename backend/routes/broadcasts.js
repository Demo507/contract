import express from 'express';
import { pool } from '../db.js';
import { wrap } from '../middleware.js';

const router = express.Router();

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(date).toLocaleDateString();
}
const short = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;

router.get('/feed', wrap(async (req, res) => {
  const listed = await pool.query('SELECT COUNT(*)::int AS c FROM products');
  const settled = await pool.query("SELECT COUNT(*)::int AS c FROM orders WHERE status IN ('Delivered','Released')");
  const products = await pool.query('SELECT title, seller_address, created_at FROM products ORDER BY created_at DESC LIMIT 5');
  const orders = await pool.query('SELECT order_id, amount, buyer_address, created_at FROM orders ORDER BY created_at DESC LIMIT 5');

  const items = [
    ...products.rows.map((p) => ({ text: `📦 '${p.title}' listed by ${short(p.seller_address)}`, at: p.created_at })),
    ...orders.rows.map((o) => ({ text: `🎉 Order #${o.order_id} placed by ${short(o.buyer_address)} for ${Number(o.amount) / 1e6} TCH8`, at: o.created_at })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8)
    .map((i, idx) => ({ id: idx, text: i.text, time: timeAgo(i.at) }));

  res.json({ feed: items, totals: { listed: listed.rows[0].c, settled: settled.rows[0].c } });
}));

export default router;
