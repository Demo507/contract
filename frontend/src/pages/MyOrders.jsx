import { useState } from 'react';
import { ESCROW_ADDRESS } from '../contracts/addresses.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useTx, friendlyError } from '../lib/useTx.js';
import { useOrders } from '../lib/useOrders.js';
import { syncOrder } from '../lib/api.js';
import { orderAmount, shorten } from '../lib/format.js';

export default function MyOrders() {
  const { orders, loading, error, reload } = useOrders('buyer');
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
    <div>
      <h1 className="font-display text-3xl mb-1">My orders</h1>
      <p className="text-sm muted mb-6">Things you bought. When the seller marks an item delivered, confirm it here to release payment.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="err">{error}</p>}
      {msg && <p className="err mb-3">{msg}</p>}
      {!loading && orders.length === 0 && !error && <p className="muted">You haven't bought anything yet.</p>}

      <div className="grid gap-3">
        {orders.map((o) => (
          <div key={o.order_id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{o.product_title || `Order #${o.order_id}`} <span className="muted text-xs">#{o.order_id}</span></p>
              <p className="text-sm muted">{orderAmount(o)} TCH8 · seller {shorten(o.seller_address)}</p>
              <div className="mt-1"><StatusBadge status={o.status} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {o.status === 'Delivered' && (
                <button className="btn btn-green" disabled={Boolean(busy)} onClick={() => run('confirmDelivery', o.order_id)}>
                  {busy === `confirmDelivery-${o.order_id}` ? 'Confirming…' : 'Confirm delivery'}
                </button>
              )}
              {o.status === 'Paid' && (
                <button className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => run('refundBeforeDelivery', o.order_id)}>
                  {busy === `refundBeforeDelivery-${o.order_id}` ? 'Refunding…' : 'Cancel & refund'}
                </button>
              )}
              {(o.status === 'Paid' || o.status === 'Delivered') && (
                <button className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => run('raiseDispute', o.order_id)}>
                  Dispute
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
