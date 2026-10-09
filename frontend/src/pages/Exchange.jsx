import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { BACKEND_URL } from '../contracts/addresses.js';

export default function Exchange() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState({ amount: '', currency: 'NGN', account_details: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState('idle');

  async function loadWithdrawals() {
    if (!address) return;
    const res = await fetch(`${BACKEND_URL}/api/withdrawals?wallet=${address}`);
    setWithdrawals(await res.json());
  }
  useEffect(() => { loadWithdrawals(); }, [address]);

  async function handleExchange(e) {
    e.preventDefault();
    if (!form.amount || !form.account_details) return;
    setStatus('submitting');
    try {
      await fetch(`${BACKEND_URL}/api/withdrawals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, ...form }),
      });
      setStatus('done');
      setForm({ amount: '', currency: 'NGN', account_details: '' });
      loadWithdrawals();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  async function handleCancel(id) {
    await fetch(`${BACKEND_URL}/api/withdrawals/${id}/cancel`, { method: 'POST' });
    loadWithdrawals();
  }

  function canCancel(w) { return w.status === 'Pending' && new Date() < new Date(w.cancel_deadline); }

  if (!isConnected) return <p style={{ color: 'var(--color-muted)' }}>Connect your wallet first.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-1">Exchange TCH8</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Already redeemed TCH8 from My Sales? Request the cash-out here. Funds land in 48–96 hours; cancel within 24 hours.
      </p>
      <form onSubmit={handleExchange} className="flex flex-col gap-3">
        <input required type="number" placeholder="Amount in TCH8" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
          <option value="NGN">NGN</option>
          <option value="USD">USD</option>
        </select>
        <input required placeholder="Account number / details" value={form.account_details} onChange={(e) => setForm({ ...form, account_details: e.target.value })} />
        <button type="submit" disabled={status === 'submitting'} style={{ background: 'var(--color-brass)' }} className="px-4 py-2.5 rounded text-sm font-medium text-[var(--color-ink)]">
          {status === 'submitting' ? 'Submitting...' : 'Exchange'}
        </button>
        {status === 'error' && <p style={{ color: 'var(--color-danger)' }}>Something went wrong.</p>}
      </form>

      <h2 className="font-display text-xl mt-8 mb-3">Your requests</h2>
      {withdrawals.map((w) => (
        <div key={w.id} style={{ border: '1px solid var(--color-line)', borderRadius: '8px', padding: '1rem', marginBottom: '0.5rem' }}>
          <p>{w.amount} TCH8 → {w.currency} — {w.status}</p>
          {canCancel(w) && <button onClick={() => handleCancel(w.id)}>Cancel</button>}
        </div>
      ))}
    </div>
  );
}