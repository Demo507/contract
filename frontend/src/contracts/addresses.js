// Deployed Sepolia addresses — update these if you redeploy.
export const TCH8_ADDRESS = '0x40e1cD143C5576610AF78bf5cF1da0C47Bbeb977';
export const ESCROW_ADDRESS = '0xCC46849276578531cD274ffc2b95b019bafc1463';

// IMPORTANT: this is what actually decides whether your site works for
// other people. `localhost:4000` only exists on YOUR computer while
// you're developing — nobody else's browser can reach it.
//
// VITE_BACKEND_URL is read from a .env file at build time:
//   VITE_BACKEND_URL=http://localhost:4000                  (developing)
//   VITE_BACKEND_URL=https://your-backend.up.railway.app    (deployed)
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';