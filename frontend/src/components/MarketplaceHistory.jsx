import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { api } from '../lib/api.js';
import { orderAmount, shorten } from '../lib/format.js';

export default function MarketplaceHistory() {
  const { address } = useAccount();
  const [tab, setTab] = useState('global');
  const [global, setGlobal] = useState([]);
  const [mine, setMine] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const g = await api('/api/orders/broadcast');
        if (alive) setGlobal(Array.isArray(g) ? g : []);
        if (address) {
          const m = await api(`/api/orders/history/${address.toLowerCase()}`);
          if (alive) setMine(Array.isArray(m) ? m : []);
        }
      } catch (e) {
        if (alive) setError(e.message);
      }
    })();
    return () => { alive = false; };
  }, [address]);

  const list = tab === 'global' ? global : mine;

  return (
    <section>
      <h2 className="font-display text-2xl mb-3">Activity</h2>
      <div className="flex gap-2 mb-4">
        <button className={`btn ${tab === 'global' ? '' : 'btn-ghost'}`} onClick={() => setTab('global')}>Everyone</button>
        <button className={`btn ${tab === 'mine' ? '' : 'btn-ghost'}`} onClick={() => setTab('mine')}>My history</button>
      </div>
      {error && <p className="err">{error}</p>}
      {list.length === 0 && !error && <p className="muted text-sm">Nothing here yet.</p>}
      <div className="grid gap-2">
        {list.map((o) => {
          const youBought = address && o.buyer_address?.toLowerCase() === address.toLowerCase();
          return (
            <div key={o.order_id} className="card px-4 py-3 text-sm">
              {tab === 'mine' && (
                <span className="text-xs mr-2" style={{ color: youBought ? 'var(--color-brass)' : 'var(--color-release)' }}>
                  {youBought ? 'BOUGHT' : 'SOLD'}
                </span>
              )}
              <strong>{o.product_title || `Order #${o.order_id}`}</strong>{' '}
              <span className="muted">· {orderAmount(o)} TCH8 · {shorten(o.buyer_address)} → {shorten(o.seller_address)} · {o.status}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
