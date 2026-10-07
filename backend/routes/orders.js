import express from 'express';
import { createClient } from '@supabase/supabase-client';

const router = express.Router();

// Initialize the database client using your environment variables
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 1. GET /api/orders?buyer=0x... or ?seller=0x...
router.get('/', async (req, res) => {
  const { buyer, seller } = req.query;
  
  let query = supabase.from('orders').select('*, products(*)').order('updated_at', { ascending: false });

  if (buyer) {
    query = query.eq('buyer_address', buyer.toLowerCase());
  } else if (seller) {
    query = query.eq('seller_address', seller.toLowerCase());
  }

  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 2. GET /api/orders/:orderId (Look up by blockchain contract order ID)
router.get('/:orderId', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(*)')
    .eq('blockchain_order_id', req.params.orderId)
    .single(); // Expecting only one match

  if (error) return res.status(404).json({ error: 'Order not found in global register' });
  res.json(data);
});

// 3. POST /api/orders (Create a tracking record when an escrow order is paid on-chain)
router.post('/', async (req, res) => {
  const { blockchainOrderId, productId, buyerAddress, sellerAddress, amountTch8 } = req.body;

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        blockchain_order_id: blockchainOrderId,
        product_id: productId,
        buyer_address: buyerAddress.toLowerCase(),
        seller_address: sellerAddress.toLowerCase(),
        amount_tch8: amountTch8,
        status: 'Paid'
      }
    ])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

// 4. PATCH /api/orders/:orderId/status (Update state: 'Delivered', 'Released', etc.)
router.patch('/:orderId/status', async (req, res) => {
  const { status } = req.body; // Expects 'Delivered', 'Released', 'Refunded', 'Disputed'

  const { data, error } = await supabase
    .from('orders')
    .update({ status: status, updated_at: new Date() })
    .eq('blockchain_order_id', req.params.orderId)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

export default router;
