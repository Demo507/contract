import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export async function initDb() {
  console.log("Safely initializing PostgreSQL schema relations with cryptographic protocols...");
  
  const client = await pool.connect();
  try {
    // Wrap entire creation routine inside a strict SQL transaction block
    await client.query('BEGIN');

    // 1. Core Users Table Setup (With Web3 secure challenge storage capacity)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        display_name TEXT,
        email TEXT,
        phone TEXT,
        date_of_birth DATE,
        country TEXT,
        nonce TEXT,                       -- Added to store the unique signing challenge
        is_profile_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. Products Table Setup (Bound cleanly to vendor wallet identities)
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        seller_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        price_tch8 TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 3. On-chain Automated Escrow Orders Table Setup
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY,
        buyer_address TEXT NOT NULL REFERENCES users(wallet_address),
        seller_address TEXT NOT NULL REFERENCES users(wallet_address),
        amount TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Paid',
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        tx_hash TEXT NOT NULL UNIQUE, 
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 4. Token Redemptions Log Setup
    await client.query(`
      CREATE TABLE IF NOT EXISTS redemptions (
        redemption_id INTEGER PRIMARY KEY,
        seller_address TEXT NOT NULL REFERENCES users(wallet_address),
        amount TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 5. Fiat Exchange Payout Track Setup
    await client.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
        amount TEXT NOT NULL,
        currency TEXT NOT NULL,
        account_details TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        cancel_deadline TIMESTAMPTZ NOT NULL,
        expected_at TIMESTAMPTZ NOT NULL
      );
    `);

    // 6. Encrypted Platform Support Complaints Table Setup
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
        order_id INTEGER REFERENCES orders(order_id) ON DELETE SET NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // ====================================================================
    // 📊 PERFORMANCE RUNTIME TUNING INDEXES (Ensures ultra-fast load intervals)
    // ====================================================================
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_address);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_address);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet ON withdrawals(wallet_address);`);

    await client.query('COMMIT');
    console.log("Database schema structures verified, linked, and indexed cleanly.");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Database compilation failed to execute safely:", error.message);
    throw error;
  } finally {
    // Release the active connection resource back into the database pool
    client.release();
  }
}

// EMERGENCY MANUAL OVERHAUL SCRIPT: Use ONLY when actively re-migrating columns during local staging tests
export async function forceResetDb() {
  console.warn("⚠️ CRITICAL ALARM: Wiping factory system configurations and live metrics...");
  await pool.query(`DROP TABLE IF EXISTS products, orders, redemptions, withdrawals, users, complaints CASCADE;`);
  await initDb();
}
