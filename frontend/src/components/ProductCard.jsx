import { useState, useEffect } from 'react';
import { parseEther } from 'viem';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { TCH8_ADDRESS, ESCROW_ADDRESS } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';
import { escrowAbi } from '../contracts/escrowAbi.js';

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

export default function ProductCard({ product }) {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState('idle');
  const [approveHash, setApproveHash] = useState(null);
  const [orderHash, setOrderHash] = useState(null);

  const { writeContractAsync: txActionAsync } = useWriteContract();

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const { isLoading: isOrderConfirming, isSuccess: isOrderSuccess } =
    useWaitForTransactionReceipt({ hash: orderHash });

  // Once approval is mined, create the escrow order
  useEffect(() => {
    if (isApprovalSuccess && step === 'approving') {
      executeOrderCreation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApprovalSuccess]);

  // Mark done once the order is mined
  useEffect(() => {
    if (isOrderSuccess) {
      setStep('done');
    }
  }, [isOrderSuccess]);

  // Step A: approve the escrow to spend the price in TCH8 (18 decimals)
  async function handleBuy() {
    if (!isConnected) return;

    try {
      const amount = parseEther(String(product.price_tch8));
      setStep('approving');
      const hash = await txActionAsync({
        address: TCH8_ADDRESS,
        abi: tch8Abi,
        functionName: 'approve',
        args: [ESCROW_ADDRESS, amount],
      });
      setApproveHash(hash);
    } catch (err) {
      console.error('Approval error:', err.shortMessage || err.message, err);
      setStep('error');
    }
  }

  // Step B: lock the funds in escrow. The contract uses msg.sender as the buyer.
  async function executeOrderCreation() {
    try {
      const amount = parseEther(String(product.price_tch8));
      setStep('creating');

      // Simulate first: if the contract would revert, we get a readable
      // reason in the console instead of a failing MetaMask popup.
      await publicClient.simulateContract({
        account: address,
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'createOrder',
        args: [product.seller_address, amount],
      });

      const hash = await txActionAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'createOrder',
        args: [product.seller_address, amount],
      });
      setOrderHash(hash);
    } catch (err) {
      console.error('Order creation error:', err.shortMessage || err.message, err);
      setStep('error');
    }
  }

  const getBuyLabel = () => {
    if (step === 'approving')
      return isApprovalConfirming ? 'Confirming Approval…' : 'Signing Approval…';
    if (step === 'creating')
      return isOrderConfirming ? 'Locking Escrow…' : 'Placing Order…';
    if (step === 'done') return '✓ Purchased';
    if (step === 'error') return 'Try Again';
    return 'Buy Now';
  };

  return (
    <div className="w-full flex flex-col h-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl overflow-hidden shadow-sm group hover:border-[var(--color-brass)] transition-all duration-200">
      {/* Product Image Frame */}
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-44 flex items-center justify-center bg-[var(--color-ink)]/40 text-[var(--color-muted)] font-display text-4xl border-b border-[var(--color-line)] select-none">
          {product.title?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      {/* Card Details Block */}
      <div className="p-5 flex flex-col flex-1 gap-2">
        <h3 className="font-display font-bold text-base text-white tracking-tight leading-snug">
          {product.title}
        </h3>

        {product.description && (
          <p className="text-xs text-[var(--color-muted)] flex-1 leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}

        <p className="text-[11px] font-medium text-[var(--color-muted)] mt-1">
          Vendor:{' '}
          <span className="font-mono text-gray-400">
            {shorten(product.seller_address)}
          </span>
        </p>

        {/* Footer Pricing & Call-to-Action Panel */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--color-line)]">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-semibold text-[var(--color-muted)] tracking-wider">
              Price
            </span>
            <span className="font-display font-bold text-base text-[var(--color-brass)]">
              {product.price_tch8} TCH8
            </span>
          </div>

          <button
            onClick={handleBuy}
            disabled={
              !isConnected ||
              step === 'approving' ||
              step === 'creating' ||
              step === 'done'
            }
            className="px-4 py-2 text-xs font-bold rounded-lg text-[var(--color-ink)] transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 shadow"
            style={{ background: 'var(--color-brass)' }}
          >
            {getBuyLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}