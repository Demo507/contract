import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { BACKEND_URL, ESCROW_ADDRESS } from '../contracts/addresses.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MyOrders() {
  const { address, isConnected } = useAccount();
  const [orders, setOrders] = useState([]);
  const [activeTxHash, setActiveTxHash] = useState(null);

  // Wagmi mutation hooks for modifying your Escrow smart contract state
  const { writeContractAsync: signContractTx } = useWriteContract();
  
  // Wait for the delivery confirmation transaction block to complete on Sepolia
  const { isLoading: isTxConfirming, isSuccess: isTxMined } = useWaitForTransactionReceipt({
    hash: activeTxHash
  });

  async function loadOrders() {
    if (!address) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders?buyer=${address}`);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  }

  // Reload the local state variables whenever the logged-in wallet updates
  useEffect(() => {
    loadOrders();
  }, [address]);

  // Chain Reaction: Once the transaction securely writes to Sepolia, reset hooks and reload backend states
  useEffect(() => {
    if (isTxMined) {
      setActiveTxHash(null);
      loadOrders();
    }
  }, [isTxMined]);

  async function handleConfirm(orderId) {
    if (activeTxHash) return; // Prevent double-triggering while a current lock is running
    try {
      const txHash = await signContractTx({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'confirmDelivery',
        args: [orderId],
      });
      setActiveTxHash(txHash); // Triggers the useWaitForTransactionReceipt listener hook
    } catch (err) {
      console.error("Confirmation rejected or failed:", err);
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--color-ink)]/50 border border-[var(--color-line)] rounded-xl border-dashed">
        <p className="text-sm text-[var(--color-muted)] text-center">
          ⚠️ Please connect your wallet to inspect your purchase orders.
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl p-12 text-center bg-[var(--color-ink)]/30 border border-[var(--color-line)] border-dashed">
        <span className="text-3xl block mb-2">🛍️</span>
        <h3 className="font-display font-semibold text-lg text-[var(--color-text)] mb-1">
          No Orders Found
        </h3>
        <p className="text-xs text-[var(--color-muted)] max-w-xs mx-auto">
          You haven't initiated any purchases yet. Head over to Browse to explore open listings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="font-display text-xl font-bold text-[var(--color-brass)]">Your Buying History</h1>
        <p className="text-xs text-[var(--color-muted)]">Track items bought via secure escrow locks.</p>
      </div>

      <div className="flex flex-col gap-3">
        {orders.map((o) => {
          const isCurrentOrderPending = activeTxHash && orders.find(item => item.order_id === o.order_id);
          
          return (
            <div 
              key={o.order_id} 
              className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm hover:border-gray-700 transition-colors"
            >
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-muted)] block">
                  Reference Identifier
                </span>
                <p className="font-bold text-sm text-white">Order #{o.order_id}</p>
                
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[var(--color-brass)] bg-[var(--color-ink)]/50 px-2 py-0.5 rounded border border-[var(--color-line)]">
                    {formatUnits(BigInt(o.amount), 18)} TCH8
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </div>

              {o.status === 'Delivered' && (
                <div className="flex items-center sm:justify-end">
                  <button 
                    onClick={() => handleConfirm(o.order_id)} 
                    disabled={isTxConfirming}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-lg text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 shadow"
                    style={{ background: 'var(--color-release, #10b981)' }}
                  >
                    {isCurrentOrderPending && isTxConfirming ? 'Releasing Funds…' : 'Confirm Delivery'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
