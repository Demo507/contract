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

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/redemptions', redemptionsRouter);
app.use('/api/withdrawals', withdrawalsRouter);
app.use('/api/users', usersRouter);
app.use('/api/complaints', complaintsRouter);

app.get('/', (req, res) => res.json({ status: 'TCH8 backend running' }));

const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`Server running on port ${port}`));