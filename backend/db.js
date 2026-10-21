import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 20000,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Wallet addresses are stored LOWERCASE everywhere and there are NO foreign keys to users.
    // (The old foreign keys + mixed-case addresses were why listing/orders failed.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        display_name TEXT, email TEXT, phone TEXT,
        date_of_birth DATE, country TEXT, nonce TEXT,
        is_profile_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        seller_address TEXT NOT NULL,
        title TEXT NOT NULL, description TEXT,
        price_tch8 TEXT NOT NULL, image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY,
        buyer_address TEXT NOT NULL, seller_address TEXT NOT NULL,
        amount TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Paid',
        product_id INTEGER, tx_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS redemptions (
        redemption_id INTEGER PRIMARY KEY,
        seller_address TEXT NOT NULL, amount TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL, amount TEXT NOT NULL,
        currency TEXT NOT NULL, account_details TEXT NOT NULL,
        redemption_id INTEGER,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        cancel_deadline TIMESTAMPTZ NOT NULL, expected_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL, order_id INTEGER,
        subject TEXT NOT NULL, message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Migrations for tables that already exist in Supabase from earlier versions
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS nonce TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE;
      ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS redemption_id INTEGER;
      ALTER TABLE orders ALTER COLUMN tx_hash DROP NOT NULL;
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_seller_address_fkey;
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_buyer_address_fkey;
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_seller_address_fkey;
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
      ALTER TABLE redemptions DROP CONSTRAINT IF EXISTS redemptions_seller_address_fkey;
      ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_wallet_address_fkey;
      ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_wallet_address_fkey;
      ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_order_id_fkey;
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_address);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_address);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);`);

    await client.query('COMMIT');
    console.log('Database ready.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database init failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}
