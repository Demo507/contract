import { useEffect, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import { BACKEND_URL, ESCROW_ADDRESS } from '../contracts/addresses.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MyOrders() {
  const { address, isConnected } = useAccount();
  const [orders, setOrders] = useState([]);
  const { writeContractAsync, isPending } = useWriteContract();

  async function loadOrders() {
    if (!address) return;
    const res = await fetch(`${BACKEND_URL}/api/orders?buyer=${address}`);
    setOrders(await res.json());
  }

  useEffect(() => {
    loadOrders();
  }, [address]);

  async function handleConfirm(orderId) {
    try {
      await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'confirmDelivery',
        args: [orderId],
      });
      await loadOrders();
    } catch (err) {
      console.error(err);
    }
  }

  if (!isConnected) {
    return <p style={{ color: 'var(--color-muted)' }}>Connect your wallet to see your orders.</p>;
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">My orders</h1>

      {orders.length === 0 ? (
        <p style={{ color: 'var(--color-muted)' }}>You haven't bought anything yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div
              key={o.order_id}
              className="rounded-md p-4 flex items-center justify-between"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)' }}
            >
              <div>
                <p className="font-medium">Order #{o.order_id}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    {formatUnits(BigInt(o.amount), 6)} TCH8
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
              {o.status === 'Delivered' && (
                <button
                  onClick={() => handleConfirm(o.order_id)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm rounded font-medium text-[var(--color-ink)] disabled:opacity-50"
                  style={{ background: 'var(--color-release)' }}
                >
                  Confirm delivery
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}