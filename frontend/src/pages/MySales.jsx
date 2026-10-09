import { useEffect, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { BACKEND_URL, ESCROW_ADDRESS } from '../contracts/addresses.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MySales() {
  const { address, isConnected } = useAccount();
  const [orders, setOrders] = useState([]);
  const [redeemAmount, setRedeemAmount] = useState('');
  const { writeContractAsync, isPending } = useWriteContract();

  async function loadOrders() {
    if (!address) return;
    const res = await fetch(`${BACKEND_URL}/api/orders?seller=${address}`);
    setOrders(await res.json());
  }
  useEffect(() => { loadOrders(); }, [address]);

  async function handleMarkDelivered(orderId) {
    try {
      await writeContractAsync({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: 'markDelivered', args: [orderId] });
      await loadOrders();
    } catch (err) { console.error(err); }
  }

  async function handleRequestRedemption() {
    if (!redeemAmount) return;
    try {
      await writeContractAsync({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: 'requestRedemption', args: [parseUnits(redeemAmount, 6)] });
      setRedeemAmount('');
    } catch (err) { console.error(err); }
  }

  if (!isConnected) return <p style={{ color: 'var(--color-muted)' }}>Connect your wallet to see your sales.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-white font-semibold mb-3">Orders</h2>
        {orders.length === 0 ? <p style={{ color: 'var(--color-muted)' }}>No sales yet.</p> : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <div key={o.order_id} className="rounded-md p-4 flex items-center justify-between" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}>
                <div>
                  <p className="font-medium">Order #{o.order_id}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{formatUnits(BigInt(o.amount), 6)} TCH8</span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                {o.status === 'Paid' && (
                  <button onClick={() => handleMarkDelivered(o.order_id)} disabled={isPending}
                    className="px-3 py-1.5 text-sm rounded font-medium text-[var(--color-ink)] disabled:opacity-50"
                    style={{ background: 'var(--color-brass)' }}>
                    Mark Delivered
                  </button>
                )}
                {o.status === 'Released' && (
                  <span style={{ color: 'var(--color-release)' }} className="text-sm">Claim TCH8 — balance updated</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-md p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}>
        <h2 className="font-display text-xl mb-1">Request Payout</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>Lock your TCH8 to redeem — finish the cash-out on the Exchange page.</p>
        <div className="flex gap-2">
          <input type="number" value={redeemAmount} onChange={(e) => setRedeemAmount(e.target.value)} placeholder="Amount in TCH8" />
          <button onClick={handleRequestRedemption} disabled={isPending || !redeemAmount}
            style={{ background: 'var(--color-release)' }} className="px-4 py-2 text-sm rounded font-medium text-[var(--color-ink)]">
            Redeem
          </button>
        </div>
      </div>
    </div>
  );
}