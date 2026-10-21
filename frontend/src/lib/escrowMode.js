import { toFunctionSelector } from 'viem';
import { ESCROW_ADDRESS } from '../contracts/addresses.js';

let cached = null;

// 'v2' = createOrder(seller, amount)            (buyer is msg.sender)
// 'v1' = createOrder(buyer, seller, amount)
export async function getEscrowMode(publicClient) {
  if (cached) return cached;
  const code = await publicClient.getBytecode({ address: ESCROW_ADDRESS });
  if (!code || code === '0x') throw new Error('No contract found at the Escrow address. Check VITE_ESCROW_ADDRESS.');
  const body = code.toLowerCase();
  const v2 = toFunctionSelector('createOrder(address,uint256)').slice(2).toLowerCase();
  const v1 = toFunctionSelector('createOrder(address,address,uint256)').slice(2).toLowerCase();
  if (body.includes(v2)) cached = 'v2';
  else if (body.includes(v1)) cached = 'v1';
  else throw new Error('The Escrow contract at this address has no createOrder function.');
  return cached;
}
