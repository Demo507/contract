import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { SALE_ADDRESS } from '../contracts/addresses.js';
import { saleAbi } from '../contracts/saleAbi.js';

export default function BuyTCH8() {
  const { isConnected } = useAccount();
  const [ethAmount, setEthAmount] = useState('');
  
  // Wagmi smart contract interaction hooks
  const { writeContract, data: hash, isPending: isSigning, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Clear input field automatically upon a completed transaction block on Sepolia
  useEffect(() => {
    if (isSuccess) {
      setEthAmount('');
    }
  }, [isSuccess]);

  const handleBuy = (e) => {
    e.preventDefault();
    if (!ethAmount || parseFloat(ethAmount) <= 0) return;

    writeContract({
      address: SALE_ADDRESS,
      abi: saleAbi,
      functionName: 'buy',
      value: parseEther(ethAmount),
    });
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--color-ink)]/50 border border-[var(--color-line)] rounded-xl border-dashed">
        <p className="text-sm text-[var(--color-muted)] text-center">
          ⚠️ Please connect your wallet first to buy TCH8 tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-brass)]">
          Acquire TCH8 Tokens
        </h1>
        <p className="text-xs mt-1 text-[var(--color-muted)] leading-relaxed">
          Send Sepolia ETH to purchase TCH8 utility tokens at the current smart contract token crowdsale swap rate.
        </p>
      </div>

      <form onSubmit={handleBuy} className="flex flex-col gap-4">
        {/* Input Field Container */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">
            Deposit Amount (Sepolia ETH)
          </label>
          <div className="relative">
            <input
              required
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="0.00"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              disabled={isSigning || isConfirming}
              className="w-full text-sm p-3 pr-16 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors disabled:opacity-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--color-muted)] select-none">
              ETH
            </span>
          </div>
        </div>

        {/* Submit Execution Button */}
        <div className="mt-2">
          <button
            type="submit"
            disabled={isSigning || isConfirming || !ethAmount}
            className="w-full bg-[var(--color-brass)] text-[var(--color-ink)] font-bold py-3 px-6 rounded-lg text-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 hover:opacity-95 shadow-md"
          >
            {isSigning ? 'Signing in Wallet...' : isConfirming ? 'Confirming Transaction...' : 'Buy TCH8'}
          </button>
        </div>

        {/* Dynamic Action Alerts */}
        {isSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 rounded-lg text-xs text-center font-medium">
            <p>🎉 Token purchase successful!</p>
            {hash && (
              <a
                href={`https://etherscan.io{hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline text-[11px] block mt-1 hover:text-blue-300 font-mono"
              >
                View on Sepolia Etherscan ↗
              </a>
            )}
          </div>
        )}

        {writeError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/40 text-rose-300 rounded-lg text-xs text-center font-medium truncate" title={writeError.message}>
            ❌ Purchase failed: {writeError.shortMessage || "Transaction rejected."}
          </div>
        )}
      </form>
    </div>
  );
}
