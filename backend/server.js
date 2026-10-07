import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-client';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import redemptionsRouter from './routes/redemptions.js';

const app = express();

// Initialize the permanent database client layer
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Open CORS for initial testing phase
app.use(cors());
app.use(express.json());

// Bind your original functional routing folders
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/redemptions', redemptionsRouter);

// =========================================================================
// 🚀 NEW SCALED ROUTING OPERATIONS BELOW (DIRECT DATABASE INTEGRATIONS)
// =========================================================================

// 1. SYNC AUTH USER TO SUPABASE
app.post('/api/users/sync', async (req, res) => {
  const { walletAddress, email, phone } = req.body;
  if (!walletAddress) return res.status(400).json({ error: "Missing wallet address" });

  const { data, error } = await supabase
    .from('users')
    .upsert({ 
      wallet_address: walletAddress.toLowerCase(), 
      email: email || null, 
      phone: phone || null 
    }, { onConflict: 'wallet_address' });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, message: "User profile synchronized successfully." });
});

// 2. GET BUYER ORDERS ("myorder" pipeline)
app.get('/api/orders/buyer/:walletAddress', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(*)')
    .eq('buyer_address', req.params.walletAddress.toLowerCase());
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 3. GET SELLER ORDERS ("orders" incoming panel)
app.get('/api/orders/seller/:walletAddress', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(*)')
    .eq('seller_address', req.params.walletAddress.toLowerCase());

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 4. SUBMIT A SECRETE COMPLAINT 
app.post('/api/complaints', async (req, res) => {
  const { orderId, reporterAddress, description } = req.body;
  const { data, error } = await supabase
    .from('complaints')
    .insert([{ order_id: orderId, reporter_address: reporterAddress.toLowerCase(), description }]);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, message: "Complaint lodged secretly with operator." });
});

// 5. OPERATOR-ONLY VIEW FOR ALL SYSTEM COMPLAINTS
app.get('/api/operator/complaints', async (req, res) => {
  const requesterWallet = req.headers['x-operator-wallet']?.toLowerCase();
  
  // Make sure you add OPERATOR_WALLET_ADDRESS to your Render environment variables!
  const actualOperator = process.env.OPERATOR_WALLET_ADDRESS?.toLowerCase();

  if (!requesterWallet || requesterWallet !== actualOperator) {
    return res.status(403).json({ error: "Access Denied: Only the system Operator can view this dashboard." });
  }

  const { data, error } = await supabase
    .from('complaints')
    .select('*, orders(*)');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Default Heartbeat endpoint
app.get('/', (req, res) => {
  res.json({ status: 'TCH8 backend running with Supabase scaling engine live' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
