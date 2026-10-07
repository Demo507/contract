import express from 'express';
import { createClient } from '@supabase/supabase-client';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// GET all redemptions
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
