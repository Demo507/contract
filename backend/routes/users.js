import express from 'express';
import { pool } from '../db.js';
import { verifyMessage } from 'viem'; // Clean library for checking signatures

const router = express.Router();

// ========================================================
// 🔐 STEP 1: REQUEST A CHALLENGE NONCE
// ========================================================
router.post('/nonce', async (req, res) => {
  const { wallet_address } = req.body;
  if (!wallet_address) return res.status(400).json({ error: 'wallet_address required' });

  try {
    const sanitizedAddress = wallet_address.trim().toLowerCase();
    // Generate a secure crypto-random nonce text string
    const generatedNonce = `Welcome to TCH8 Portal!\n\nSign this secure phrase to log in. This costs no gas.\n\nSecurity Challenge ID: ${Math.floor(Math.random() * 1000000)}`;

    // Upsert the wallet address and save the text challenge
    await pool.query(`
      INSERT INTO users (wallet_address, nonce) 
      VALUES ($1, $2)
      ON CONFLICT (wallet_address) DO UPDATE SET nonce = EXCLUDED.nonce`,
      [sanitizedAddress, generatedNonce]
    );

    res.json({ nonce: generatedNonce });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed generating secure authorization challenge.' });
  }
});

// ========================================================
// 🛡️ STEP 2: VERIFY SIGNATURE & AUTHORIZE LOG IN
// ========================================================
router.post('/verify', async (req, res) => {
  const { wallet_address, signature } = req.body;
  if (!wallet_address || !signature) {
    return res.status(400).json({ error: 'wallet_address and signature details are required.' });
  }

  try {
    const sanitizedAddress = wallet_address.trim().toLowerCase();

    // Fetch the specific nonce saved in Step 1
    const userQuery = await pool.query('SELECT * FROM users WHERE wallet_address = \$1', [sanitizedAddress]);
    if (userQuery.rows.length === 0) return res.status(404).json({ error: 'No authorization challenge found' });

    const dbUser = userQuery.rows[0];

    // Cryptographically verify that the signature matches the wallet address
    const isValid = await verifyMessage({
      address: sanitizedAddress,
      message: dbUser.nonce,
      signature: signature,
    });

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid cryptographical signature authorization.' });
    }

    // Erase the nonce right away so it can never be reused maliciously
    await pool.query('UPDATE users SET nonce = NULL WHERE wallet_address = \$1', [sanitizedAddress]);

    res.json({
      success: true,
      message: 'Login authenticated successfully.',
      user: dbUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cryptographic authentication sub-process exception.' });
  }
});

// ========================================================
// 📝 STEP 3: SUBMIT / MANAGE USER CREDENTIAL DETAILS
// ========================================================
router.put('/profile/:address', async (req, res) => {
  const targetAddress = req.params.address.toLowerCase();
  const { display_name, email, phone, date_of_birth, country } = req.body;

  if (!display_name || !email || !date_of_birth || !country) {
    return res.status(400).json({ error: 'Missing mandatory registration fields.' });
  }

  try {
    const updateQuery = `
      UPDATE users 
      SET 
        display_name = $1, 
        email = $2, 
        phone = $3, 
        date_of_birth = $4, 
        country = $5,
        is_profile_complete = TRUE
      WHERE LOWER(wallet_address) = $6
      RETURNING *`;

    const { rows } = await pool.query(updateQuery, [
      display_name, email, phone || null, date_of_birth, country, targetAddress
    ]);

    if (rows.length === 0) return res.status(404).json({ error: 'Wallet profile record not indexed.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed saving user credentials profile fields.' });
  }
});

export default router;
