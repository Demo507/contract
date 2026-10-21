// Deployed Sepolia contracts. Lowercased so wallet libraries never reject a mixed-case checksum typo.
export const TCH8_ADDRESS = '0x40e1cD143C5576610AF78bf5cF1da0C47Bbeb977'.toLowerCase();
export const ESCROW_ADDRESS = (import.meta.env.VITE_ESCROW_ADDRESS || '0xB13b99fDAB66beDB79a1987e9f68267beb42B6Ab').toLowerCase();
export const SALE_ADDRESS = (import.meta.env.VITE_SALE_ADDRESS || '0x72F8C939BBB4022Fd8cB233b5Fb69513198fE55e').toLowerCase();

// Admin wallet that sees the Admin dashboard
export const OPERATOR_ADDRESS = (import.meta.env.VITE_OPERATOR_ADDRESS || '').toLowerCase();

// Your Render URL. "localhost" only works on your own PC.
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

export const TOKEN_DECIMALS = 6;
