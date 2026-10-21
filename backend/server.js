import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import redemptionsRouter from './routes/redemptions.js';
import withdrawalsRouter from './routes/withdrawals.js';
import usersRouter from './routes/users.js';
import complaintsRouter from './routes/complaints.js';
import analyticsRouter from './routes/analytics.js';
import broadcastsRouter from './routes/broadcasts.js';

const app = express();

// FRONTEND_URL is optional. If set (e.g. https://your-app.vercel.app) only your site may call the API.
const allowed = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors(allowed.length ? { origin: allowed } : {}));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => res.json({ status: 'TCH8 backend running' }));
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/redemptions', redemptionsRouter);
app.use('/api/withdrawals', withdrawalsRouter);
app.use('/api/users', usersRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/broadcasts', broadcastsRouter);

// Any error thrown inside a route lands here instead of crashing the server
app.use((err, req, res, next) => {
  console.error(`${req.method} ${req.originalUrl} failed:`, err.message);
  res.status(500).json({ error: err.shortMessage || err.message || 'Server error' });
});

process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e));

const port = process.env.PORT || 4000;

async function start() {
  // Listen first so Render sees an open port, then connect to the database.
  app.listen(port, () => console.log(`Server running on port ${port}`));
  try {
    await initDb();
  } catch (e) {
    console.error('Database is NOT connected. Check DATABASE_URL (use the Supabase SESSION POOLER string).', e.message);
  }
}
start();
