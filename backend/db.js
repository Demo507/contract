import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Opens (and creates, on first run) a local SQLite file. This holds
// everything that does NOT belong on-chain: product listings, and a
// local cache of order/redemption events read from Escrow so the
// frontend doesn't have to query the blockchain directly every time.
export async function getDb() {
  const db = await open({
    filename: './tch8.sqlite',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_address TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price_tch8 TEXT NOT NULL, -- stored as string: 6-decimal integer amount
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY,       -- matches Escrow's on-chain orderId
      buyer_address TEXT NOT NULL,
      seller_address TEXT NOT NULL,
      amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Paid', -- Paid | Delivered | Released | Refunded | Disputed
      product_id INTEGER,
      tx_hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      redemption_id INTEGER PRIMARY KEY,  -- matches Escrow's on-chain redemptionId
      seller_address TEXT NOT NULL,
      amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending', -- Pending | Completed | Rejected
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS indexer_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_block INTEGER NOT NULL
    );
  `);

  return db;
}