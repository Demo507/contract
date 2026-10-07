import express from 'express';
import { createClient } from '@supabase/supabase-client';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// GET all active products
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST a new product
router.post('/', async (req, res) => {
  const { title, price_tch8, seller_address } = req.body;

  const { data, error } = await supabase
    .from('products')
    .insert([{ title, price_tch8, seller_address: seller_address.toLowerCase() }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

export default router;
