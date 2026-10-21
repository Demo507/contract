import { formatUnits } from 'viem';
import { TOKEN_DECIMALS } from '../contracts/addresses.js';

export const shorten = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '');

export function fmtTch8(units) {
  try {
    const s = formatUnits(BigInt(units ?? 0), TOKEN_DECIMALS);
    return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  } catch {
    return '0';
  }
}

// Order amount comes back 0 once an order is released, so fall back to the listing price.
export function orderAmount(o) {
  try {
    const a = BigInt(o.amount || '0');
    if (a > 0n) return fmtTch8(a);
  } catch { /* ignore */ }
  return o.product_price ?? '—';
}
