import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseEther } from 'viem';
import { BACKEND_URL, ESCROW_ADDRESS } from '../contracts/addresses.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MySales() {
  const { address, isConnected } = useAccount();
  const [orders, setOrders] = useState([]);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [activeTxHash, setActiveTxHash] = useState(null);

  // Wagmi smart contract interaction hooks
  const { writeContractAsync: signContractTx } = useWriteContract();
  
  // Explicit block monitoring listener for Sepolia transactions
  const { isLoading: isTxConfirming, isSuccess: isTxMined } = useWaitForTransactionReceipt({
    hash: activeTxHash
  });

  async function loadOrders() {
    if (!address) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders?seller=${address}`);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Failed to load sales orders:', err);
    }
  }

  // Handle initial loading and account changes
  useEffect(() => {
    loadOrders();
  }, [address]);

  // Once a transaction completes successfully, refresh data and unlock states
  useEffect(() => {
    if (isTxMined) {
      setActiveTxHash(null);
      setRedeemAmount('');
      loadOrders();
    }
  }, [isTxMined]);

  async function handleMarkDelivered(orderId) {
    if (activeTxHash) return;
    try {
      const txHash = await signContractTx({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'markDelivered',
        args: [orderId],
      });
      setActiveTxHash(txHash);
    } catch (err) {
      console.error("Failed to mark order as delivered:", err);
    }
  }

  async function handleRequestRedemption(e) {
    e.preventDefault();
    if (!redeemAmount || activeTxHash) return;
    try {
      const txHash = await signContractTx({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'requestRedemption',
        args: [parseEther(redeemAmount)], // Adjusted to 18 decimals
      });
      setActiveTxHash(txHash);
    } catch (err) {
      console.error("Redemption request failed:", err);
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--color-ink)]/50 border border-[var(--color-line)] rounded-xl border-dashed">
        <p className="text-sm text-[var(--color-muted)] text-center">
          ⚠️ Please connect your wallet to inspect your vendor sales profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* SECTION 1: ESCROW ORDERS RECEIVED */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--color-brass)]">Your Vendor Sales History</h1>
          <p className="text-xs text-[var(--color-muted)]">Manage incoming customer purchases and escrow fulfillments.</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl p-12 text-center bg-[var(--color-ink)]/30 border border-[var(--color-line)] border-dashed">
            <span className="text-3xl block mb-2">📈</span>
            <h3 className="font-display font-semibold text-lg text-[var(--color-text)] mb-1">No Sales Yet</h3>
            <p className="text-xs text-[var(--color-muted)] max-w-xs mx-auto">
              Your items haven't received purchases yet. Active orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <div 
                key={o.order_id} 
                className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm hover:border-gray-700 transition-colors"
              >
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-muted)] block">Reference Identifier</span>
                  <p className="font-bold text-sm text-white">Order #{o.order_id}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[var(--color-brass)] bg-[var(--color-ink)]/50 px-2 py-0.5 rounded border border-[var(--color-line)]">
                      {formatUnits(BigInt(o.amount), 18)} TCH8
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>

                {o.status === 'Paid' && (
                  <div className="flex items-center sm:justify-end">
                    <button 
                      onClick={() => handleMarkDelivered(o.order_id)} 
                      disabled={isTxConfirming}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-lg text-[var(--color-ink)] transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 shadow"
                      style={{ background: 'var(--color-brass)' }}
                    >
                      {activeTxHash && isTxConfirming ? 'Updating Status…' : 'Mark Delivered'}
                    </button>
                  </div>
                )}
                
                {o.status === 'Released' && (
                  <div className="flex items-center sm:justify-end text-xs font-medium text-[var(--color-release, #10b981)] bg-emerald-950/20 border border-emerald-800/30 px-3 py-1.5 rounded-lg">
                    ✨ TCH8 Claimable — Check Payout Balance
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: REQUEST PAYOUT UTILITY BLOCK */}
      <div className="rounded-xl p-5 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-xl">
        <h2 className="font-display text-lg font-bold text-white mb-1">Request Payout</h2>
        <p className="text-xs text-[var(--color-muted)] mb-4 leading-relaxed">
          Lock your released escrow tokens into the redemption cycle. Once processed here, navigate to the **Exchange** page to finalize your cash-out.
        </p>

        <form onSubmit={handleRequestRedemption} className="flex flex-col sm:flex-row gap-3 max-w-md">
          <div className="relative flex-1">
            <input 
              type="number" 
              step="any"
              required
              disabled={isTxConfirming}
              value={redeemAmount} 
              onChange={(e) => setRedeemAmount(e.target.value)} 
              placeholder="0.00" 
              className="w-full text-sm p-2.5 pr-16 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors disabled:opacity-50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[var(--color-muted)]">
              TCH8
            </span>
          </div>

          <button 
            type="submit" 
            disabled={isTxConfirming || !redeemAmount}
            className="px-5 py-2.5 text-xs font-bold rounded-lg text-[var(--color-ink)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 shadow-md whitespace-nowrap"
            style={{ background: 'var(--color-release, #10b981)' }}
          >
            {activeTxHash && isTxConfirming ? 'Processing Payout…' : 'Redeem Tokens'}
          </button>
        </form>

        {activeTxHash && (
          <div className="mt-3 p-2 rounded bg-yellow-950/20 border border-yellow-800/30 text-yellow-200 text-[10px] font-mono flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            Transaction submitted. Awaiting block confirmation on Sepolia...
          </div>
        )}
      </div>
    </div>
  );
}
