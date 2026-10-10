import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Helper to format timestamps elegantly for a professional frontend stream
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

router.get('/feed', async (req, res) => {
  try {
    // 1. Fetch rolling global aggregate summary metrics
    const totalListedRes = await pool.query('SELECT COUNT(*) FROM products');
    const totalSettledRes = await pool.query("SELECT COUNT(*) FROM orders WHERE status IN ('Delivered', 'Released')");

    // 2. Query recent items to construct the public activity feed
    const recentProducts = await pool.query(
      'SELECT title, seller_address, created_at FROM products ORDER BY created_at DESC LIMIT 5'
    );
    const recentOrders = await pool.query(
      'SELECT order_id, amount, buyer_address, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
    );

    const compiledFeed = [];

    // Map listed items to feed events
    recentProducts.rows.forEach((p, idx) => {
      const shortAddr = `${p.seller_address.slice(0, 6)}...${p.seller_address.slice(-4)}`;
      compiledFeed.push({
        id: `prod-${idx}-${p.created_at}`,
        text: `📦 Item '${p.title}' listed by ${shortAddr}`,
        timestamp: new Date(p.created_at)
      });
    });

    // Map successful transactions to feed events
    recentOrders.rows.forEach((o, idx) => {
      const shortAddr = `${o.buyer_address.slice(0, 6)}...${o.buyer_address.slice(-4)}`;
      compiledFeed.push({
        id: `ord-${idx}-${o.created_at}`,
        text: `🎉 Order #${o.order_id} processed by ${shortAddr} for ${o.amount} TCH8`,
        timestamp: new Date(o.created_at)
      });
    });

    // Sort the entire combined feed so everything flows chronologically
    const sortedFeed = compiledFeed
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8) // Keep the top 8 elements clean for marquee loop space
      .map(item => ({
        id: item.id,
        text: item.text,
        time: formatTimeAgo(item.timestamp)
      }));

    res.json({
      feed: sortedFeed,
      totals: {
        tch8Bought: 45200, // Hardcoded placeholder or map to crowdsale records if applicable
        listed: parseInt(totalListedCountRes?.rows[0]?.count || recentProducts.rows.length),
        bought: parseInt(totalSettledCountRes?.rows[0]?.count || recentOrders.rows.length)
      }
    });
  } catch (err) {
    console.error('Broadcast generator failed:', err);
    res.status(500).json({ error: 'Failed generating broadcast feed elements' });
  }
});

export default router;
