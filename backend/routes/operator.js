import express from 'express';
import { createClient } from '@supabase/supabase-client';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/complaints', async (req, res) => {
  const requesterWallet = req.headers['x-operator-wallet']?.toLowerCase();
  const actualOperator = process.env.OPERATOR_WALLET_ADDRESS.toLowerCase();

  if (!requesterWallet || requesterWallet !== actualOperator) {
    return res.status(403).json({ error: "Access Denied: Only the system Operator can view this dashboard." });
  }

  const { data, error } = await supabase
    .from('complaints')
    .select('*, orders(*)');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
