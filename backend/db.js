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
  console.log("Wiping and rebuilding all database tables...");
  await pool.query(`
    -- Force clear all old tables to resolve column mismatches
    DROP TABLE IF EXISTS products, orders, redemptions, withdrawals, users, complaints CASCADE;

    CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      seller_address TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price_tch8 TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE orders (
      order_id INTEGER PRIMARY KEY,
      buyer_address TEXT NOT NULL,
      seller_address TEXT NOT NULL,
      amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Paid',
      product_id INTEGER,
      tx_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE redemptions (
      redemption_id INTEGER PRIMARY KEY,
      seller_address TEXT NOT NULL,
      amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE withdrawals (
      id SERIAL PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL,
      account_details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMPTZ DEFAULT now(),
      cancel_deadline TIMESTAMPTZ NOT NULL,
      expected_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE users (
      wallet_address TEXT PRIMARY KEY,
      display_name TEXT,
      email TEXT,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE complaints (
      id SERIAL PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      order_id INTEGER,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

// TEMPORARILY UNCOMMENTED TO RUN THE FORCE RESET ONCE
//initDb()
 //.then(() => {
    //console.log("All database tables successfully reset and realigned!");
    //process.exit(0);
 //})
 //.catch((err) => {
    //console.error("Database reset failed:", err.message);
    //process.exit(1);
 //});

