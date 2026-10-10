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
    try {
      const res = await fetch(`${BACKEND_URL}/api/withdrawals?wallet=${address}`);
      if (res.ok) {
        setWithdrawals(await res.json());
      }
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    }
  }

  useEffect(() => {
    loadWithdrawals();
  }, [address]);

  async function handleExchange(e) {
    e.preventDefault();
    if (!form.amount || !form.account_details) return;
    setStatus('submitting');
    try {
      const res = await fetch(`${BACKEND_URL}/api/withdrawals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, ...form }),
      });
      if (!res.ok) throw new Error('Submission failed');
      
      setStatus('done');
      setForm({ amount: '', currency: 'NGN', account_details: '' });
      loadWithdrawals();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  async function handleCancel(id) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/withdrawals/${id}/cancel`, { method: 'POST' });
      if (res.ok) loadWithdrawals();
    } catch (err) {
      console.error('Failed to cancel withdrawal:', err);
    }
  }

  function canCancel(w) { 
    return w.status === 'Pending' && new Date() < new Date(w.cancel_deadline); 
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--color-ink)]/50 border border-[var(--color-line)] rounded-xl border-dashed">
        <p className="text-sm text-[var(--color-muted)] text-center">
          ⚠️ Please connect your wallet first to request or review cash-outs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      
      {/* LEFT COLUMN: REQUEST FORM BLOCK */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-5 rounded-xl shadow-xl flex flex-col justify-between">
        <div>
          <div className="mb-5">
            <h1 className="font-display text-xl font-bold text-[var(--color-brass)]">Exchange TCH8</h1>
            <p className="text-xs mt-1 text-[var(--color-muted)] leading-relaxed">
              Have you already requested redemption from **My Sales**? Submit your bank or payout details here. 
              Funds arrive in 48–96 hours. You can cancel requests within 24 hours.
            </p>
          </div>

          <form onSubmit={handleExchange} className="flex flex-col gap-4">
            {/* Amount Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Amount to Cash Out</label>
              <div className="relative">
                <input 
                  required 
                  type="number" 
                  placeholder="0.00" 
                  value={form.amount} 
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full text-sm p-3 pr-24 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--color-brass)]">
                  TCH8
                </span>
              </div>
            </div>

            {/* Currency Choice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Settlement Currency</label>
              <select 
                value={form.currency} 
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors appearance-none cursor-pointer"
              >
                <option value="NGN">🇳🇬 Nigerian Naira (NGN)</option>
                <option value="USD">🇺🇸 United States Dollar (USD)</option>
              </select>
            </div>

            {/* Account Details */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Destination Account Details</label>
              <textarea 
                required 
                placeholder="e.g., Bank Name, Account Number, Full Account Holder Name" 
                value={form.account_details} 
                onChange={(e) => setForm({ ...form, account_details: e.target.value })}
                rows={2}
                className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="mt-2">
              <button 
                type="submit" 
                disabled={status === 'submitting'}
                className="w-full bg-[var(--color-brass)] text-[var(--color-ink)] font-bold py-3 px-6 rounded-lg text-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 hover:opacity-95 shadow-md"
              >
                {status === 'submitting' ? 'Submitting Request...' : 'Initiate Exchange'}
              </button>
            </div>

            {/* Alert Badges */}
            {status === 'done' && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 rounded-lg text-xs text-center font-medium">
                🎉 Exchange request submitted successfully!
              </div>
            )}
            {status === 'error' && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/40 text-rose-300 rounded-lg text-xs text-center font-medium">
                ❌ Something went wrong. Please try again.
              </div>
            )}
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: REQUESTS LEDGER LIST */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-5 rounded-xl shadow-xl flex flex-col">
        <div className="mb-4">
          <h2 className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">
            Your Exchange Requests ({withdrawals.length})
          </h2>
        </div>

        {withdrawals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl p-8 bg-[var(--color-ink)]/30 border border-[var(--color-line)] border-dashed min-h-[250px]">
            <span className="text-2xl block mb-2">💱</span>
            <p className="text-xs text-[var(--color-muted)] text-center">No cash-out history found for this address.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto max-h-[420px] flex flex-col gap-3 pr-1">
            {withdrawals.map((w) => (
              <div 
                key={w.id} 
                className="rounded-xl p-4 flex items-center justify-between gap-4 bg-[var(--color-ink)]/40 border border-[var(--color-line)] shadow-sm group hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[var(--color-brass)]">
                      {w.amount} TCH8
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">➔</span>
                    <span className="text-xs font-bold text-white bg-[var(--color-surface)] border border-[var(--color-line)] px-1.5 py-0.5 rounded">
                      {w.currency}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)] truncate max-w-[200px]" title={w.account_details}>
                    {w.account_details}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Custom status pill styles */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    w.status === 'Completed' ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-400' :
                    w.status === 'Pending' ? 'bg-yellow-950/50 border border-yellow-800 text-yellow-400' :
                    'bg-zinc-800 border border-zinc-700 text-zinc-400'
                  }`}>
                    {w.status}
                  </span>

                  {canCancel(w) && (
                    <button 
                      onClick={() => handleCancel(w.id)}
                      className="px-2.5 py-1 bg-red-950 text-red-300 hover:bg-red-900 border border-red-800/60 rounded-md text-[11px] font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
