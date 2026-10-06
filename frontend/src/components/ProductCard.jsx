import { useState } from 'react';
import { parseUnits } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';
import { TCH8_ADDRESS, ESCROW_ADDRESS } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';
import { escrowAbi } from '../contracts/escrowAbi.js';

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

export default function ProductCard({ product }) {
  const { isConnected } = useAccount();
  const [step, setStep] = useState('idle');

  const { writeContractAsync } = useWriteContract();

  async function handleBuy() {
    if (!isConnected) return;
    const amount = parseUnits(product.price_tch8, 6);

    try {
      setStep('approving');
      await writeContractAsync({
        address: TCH8_ADDRESS,
        abi: tch8Abi,
        functionName: 'approve',
        args: [ESCROW_ADDRESS, amount],
      });

      setStep('creating');
      await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'createOrder',
        args: [product.seller_address, amount],
      });

      setStep('done');
    } catch (err) {
      console.error(err);
      setStep('error');
    }
  }

  const buyLabel = {
    idle: 'Buy',
    approving: 'Approving…',
    creating: 'Placing order…',
    done: 'Order placed',
    error: 'Try again',
  }[step];

  return (
    <div
      className="rounded-md overflow-hidden flex flex-col"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
    >
      {product.image_url ? (
        <img src={product.image_url} alt={product.title} className="w-full h-44 object-cover" />
      ) : (
        <div
          className="w-full h-44 flex items-center justify-center font-display text-3xl"
          style={{ background: 'var(--color-surface-raised)', color: 'var(--color-line)' }}
        >
          {product.title?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-display text-lg leading-snug">{product.title}</h3>
        {product.description && (
          <p className="text-sm flex-1" style={{ color: 'var(--color-muted)' }}>
            {product.description}
          </p>
        )}
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Sold by {shorten(product.seller_address)}
        </p>

        <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: '1px solid var(--color-line)' }}>
          <span className="font-display text-lg" style={{ color: 'var(--color-brass)' }}>
            {product.price_tch8} TCH8
          </span>
          <button
            onClick={handleBuy}
            disabled={!isConnected || step === 'approving' || step === 'creating'}
            className="px-3 py-1.5 text-sm rounded font-medium text-[var(--color-ink)] disabled:opacity-50 transition"
            style={{ background: 'var(--color-brass)' }}
          >
            {buyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}