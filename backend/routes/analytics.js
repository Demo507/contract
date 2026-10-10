import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/user/:address', async (req, res) => {
  const userAddress = req.params.address.toLowerCase();
  
  try {
    // 1. Fetch all escrow orders involving this specific wallet string
    const ordersQuery = await pool.query(
      `SELECT amount, buyer_address, seller_address, created_at 
       FROM orders 
       WHERE LOWER(buyer_address) = $1 OR LOWER(seller_address) = $1`,
      [userAddress]
    );

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let dailyVolume = 0;
    let monthlyVolume = 0;
    let yearlyVolume = 0;
    let itemsBoughtCount = 0;
    let itemsSoldCount = 0;

    ordersQuery.rows.forEach(order => {
      const orderDate = new Date(order.created_at);
      
      // Use standard parseFloat on string-based blockchain amounts safely
      const amount = parseFloat(order.amount || 0);
      const buyer = order.buyer_address.toLowerCase();
      const seller = order.seller_address.toLowerCase();

      // Aggregate volume time segments
      if (orderDate >= oneDayAgo) dailyVolume += amount;
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) monthlyVolume += amount;
      if (orderDate.getFullYear() === currentYear) yearlyVolume += amount;

      // Map action frequency metrics
      if (buyer === userAddress) itemsBoughtCount += 1;
      if (seller === userAddress) itemsSoldCount += 1;
    });

    res.json({
      analytics: { dailyVolume, monthlyVolume, yearlyVolume },
      summary: { tokensBoughtTotal: 0, itemsBoughtCount, itemsSoldCount }
    });
  } catch (err) {
    console.error('Analytics calculation engine failed:', err);
    res.status(500).json({ error: 'Failed computing analytics database arrays' });
  }
});

export default router;
