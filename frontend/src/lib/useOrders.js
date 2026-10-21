import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { api, syncOrder } from './api.js';

const OPEN = ['Paid', 'Delivered', 'Disputed'];

// role: 'buyer' | 'seller'. Loads orders, and re-checks unfinished ones against the blockchain.
export function useOrders(role) {
  const { address } = useAccount();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const path = `/api/orders?${role}=${address.toLowerCase()}`;
      let list = await api(path);
      const open = list.filter((o) => OPEN.includes(o.status)).slice(0, 10);
      if (open.length) {
        const results = await Promise.allSettled(open.map((o) => syncOrder(o.order_id)));
        const changed = results.some((r, i) => r.status === 'fulfilled' && r.value?.status !== open[i].status);
        if (changed) list = await api(path);
      }
      setOrders(list);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [address, role]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  return { orders, loading, error, reload: load };
}
