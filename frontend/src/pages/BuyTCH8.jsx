import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { SALE_ADDRESS } from '../contracts/addresses.js';
import { saleAbi } from '../contracts/saleAbi.js';

export default function BuyTCH8() {
  const { isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [ethAmount, setEthAmount] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleBuy(e) {
    e.preventDefault();
    setStatus('buying');
    try {
      await writeContractAsync({ address: SALE_ADDRESS, abi: saleAbi, functionName: 'buy', value: parseEther(ethAmount) });
      setStatus('done');
      setEthAmount('');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  if (!isConnected) return <p style={{ color: 'var(--color-muted)' }}>Connect your wallet first.</p>;

  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl mb-1">Buy TCH8</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>Send Sepolia ETH to receive TCH8 at the current rate (testnet).</p>
      <form onSubmit={handleBuy} className="flex flex-col gap-3">
        <input required type="number" step="0.0001" placeholder="Amount in ETH" value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} />
        <button type="submit" disabled={isPending} style={{ background: 'var(--color-brass)' }} className="px-4 py-2.5 rounded text-sm font-medium text-[var(--color-ink)]">
          {status === 'buying' ? 'Processing...' : 'Buy TCH8'}
        </button>
        {status === 'done' && <p style={{ color: 'var(--color-release)' }}>Purchase successful!</p>}
        {status === 'error' && <p style={{ color: 'var(--color-danger)' }}>Purchase failed — try again.</p>}
      </form>
    </div>
  );
}