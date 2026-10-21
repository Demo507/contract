import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ESCROW_ADDRESS } from '../contracts/addresses.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useTx, friendlyError } from '../lib/useTx.js';
import { useOrders } from '../lib/useOrders.js';
import { syncOrder } from '../lib/api.js';
import { orderAmount, shorten } from '../lib/format.js';

export default function MySales() {
  const { orders, loading, error, reload } = useOrders('seller');
  const { send, refresh } = useTx();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  async function run(functionName, orderId) {
    setBusy(`${functionName}-${orderId}`);
    setMsg('');
    try {
      await send({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName, args: [BigInt(orderId)] });
      try { await syncOrder(orderId); } catch { /* reload below will retry */ }
      refresh();
      await reload();
    } catch (e) {
      setMsg(friendlyError(e));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-display text-3xl mb-1">My sales</h1>
        <p className="text-sm muted mb-6">
          When a buyer pays, the money waits in escrow. Mark the item delivered; once the buyer confirms, the TCH8 is
          sent straight to your wallet.
        </p>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="err">{error}</p>}
        {msg && <p className="err mb-3">{msg}</p>}
        {!loading && orders.length === 0 && !error && <p className="muted">No sales yet.</p>}

        <div className="grid gap-3">
          {orders.map((o) => (
            <div key={o.order_id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{o.product_title || `Order #${o.order_id}`} <span className="muted text-xs">#{o.order_id}</span></p>
                <p className="text-sm muted">{orderAmount(o)} TCH8 · buyer {shorten(o.buyer_address)}</p>
                <div className="mt-1"><StatusBadge status={o.status} /></div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {o.status === 'Paid' && (
                  <button className="btn" disabled={Boolean(busy)} onClick={() => run('markDelivered', o.order_id)}>
                    {busy === `markDelivered-${o.order_id}` ? 'Marking…' : 'Mark delivered'}
                  </button>
                )}
                {o.status === 'Delivered' && (
                  <button className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => run('claimAfterWindow', o.order_id)}
                          title="Only works 7 days after delivery if the buyer never confirms">
                    Claim (after 7 days)
                  </button>
                )}
                {o.status === 'Released' && <span className="ok">Paid ✓ TCH8 is in your wallet</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 max-w-md">
        <h2 className="font-display text-xl mb-1">Cash out your TCH8</h2>
        <p className="text-sm muted mb-3">Turn your TCH8 into real money (arrives in 48–96 hours, cancel within 24 hours).</p>
        <Link to="/exchange" className="btn inline-block">Go to Exchange</Link>
      </div>
    </div>
  );
}
