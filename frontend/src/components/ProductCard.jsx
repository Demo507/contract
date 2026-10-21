import { useState } from 'react';
import { parseUnits, parseEventLogs } from 'viem';
import { useAccount } from 'wagmi';
import { TCH8_ADDRESS, ESCROW_ADDRESS, TOKEN_DECIMALS } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import { useTx, friendlyError } from '../lib/useTx.js';
import { getEscrowMode } from '../lib/escrowMode.js';
import { syncOrder } from '../lib/api.js';
import { shorten } from '../lib/format.js';

export default function ProductCard({ product }) {
  const { isConnected, address } = useAccount();
  const { send, refresh, publicClient } = useTx();
  const [step, setStep] = useState('idle'); // idle | approving | creating | done | error
  const [msg, setMsg] = useState('');

  const isOwn = Boolean(address) && product.seller_address?.toLowerCase() === address.toLowerCase();

  async function handleBuy() {
    setMsg('');
    try {
      // TCH8 has 6 decimals (parseUnits(..., 6)), NOT 18.
      const amount = parseUnits(String(product.price_tch8), TOKEN_DECIMALS);

      // 1) Make sure the buyer can actually pay
      const balance = await publicClient.readContract({
        address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'balanceOf', args: [address],
      });
      if (balance < amount) {
        setStep('error');
        setMsg('You do not have enough TCH8. Get some on the "Buy TCH8" page first.');
        return;
      }

      // 2) Allow the Escrow to take the price from THIS wallet (only if not already allowed)
      setStep('approving');
      const allowance = await publicClient.readContract({
        address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'allowance', args: [address, ESCROW_ADDRESS],
      });
      if (allowance < amount) {
        await send({ address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'approve', args: [ESCROW_ADDRESS, amount] });
      }

      // 3) Place the order. Money goes buyer wallet -> Escrow.
      setStep('creating');
      const mode = await getEscrowMode(publicClient);
      const seller = product.seller_address.toLowerCase();
      const args = mode === 'v2' ? [seller, amount] : [address, seller, amount];
      const { hash, receipt } = await send({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: 'createOrder', args });

      // 4) Save it (the backend reads the order from the chain itself)
      const logs = parseEventLogs({ abi: escrowAbi, logs: receipt.logs, eventName: 'OrderCreated' });
      const orderId = logs[0]?.args?.orderId;
      if (orderId !== undefined) {
        try { await syncOrder(Number(orderId), { product_id: product.id, tx_hash: hash }); } catch { /* refresh will catch up */ }
      }
      refresh();
      setStep('done');
    } catch (e) {
      console.error(e);
      setStep('error');
      setMsg(friendlyError(e));
    }
  }

  const label = {
    idle: 'Buy now',
    approving: 'Step 1/2: approve in wallet…',
    creating: 'Step 2/2: placing order…',
    done: '✓ Order placed',
    error: 'Try again',
  }[step];

  return (
    <div className="card overflow-hidden flex flex-col h-full">
      {product.image_url ? (
        <img src={product.image_url} alt={product.title} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 flex items-center justify-center font-display text-4xl select-none"
             style={{ background: 'var(--color-surface-raised)', color: 'var(--color-line)' }}>
          {product.title?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-display text-lg leading-snug">{product.title}</h3>
        {product.description && <p className="text-sm muted flex-1">{product.description}</p>}
        <p className="text-xs muted">Seller: <span className="font-mono">{shorten(product.seller_address)}</span></p>

        <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: '1px solid var(--color-line)' }}>
          <span className="font-display text-lg" style={{ color: 'var(--color-brass)' }}>{product.price_tch8} TCH8</span>
          {isOwn ? (
            <span className="text-xs muted">Your listing</span>
          ) : (
            <button
              className="btn"
              onClick={handleBuy}
              disabled={!isConnected || step === 'approving' || step === 'creating' || step === 'done'}
            >
              {label}
            </button>
          )}
        </div>
        {step === 'done' && <p className="ok">Payment is locked in escrow. Track it under "My Orders".</p>}
        {msg && <p className="err">{msg}</p>}
      </div>
    </div>
  );
}
