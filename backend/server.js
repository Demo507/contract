import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import redemptionsRouter from './routes/redemptions.js';

const app = express();

// In development this allows any origin (fine on localhost). Once you
// deploy the frontend to a real domain, replace this with
// cors({ origin: 'https://your-frontend-domain.com' }) so only your
// actual site can call this API.
app.use(cors());
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/redemptions', redemptionsRouter);

app.get('/', (req, res) => {
  res.json({ status: 'TCH8 backend running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

});