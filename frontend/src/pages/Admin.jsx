import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../lib/api.js';
import { OPERATOR_ADDRESS } from '../contracts/addresses.js';
import { shorten } from '../lib/format.js';

export default function Admin() {
  const { address } = useAccount();
  const isOperator = Boolean(OPERATOR_ADDRESS) && address?.toLowerCase() === OPERATOR_ADDRESS;

  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('tch8_admin_key') || '');
  const [complaints, setComplaints] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!isOperator) return;
    setMsg('');
    try { setComplaints(await api(`/api/complaints?requester_address=${address}`)); }
    catch (e) { setMsg(e.message); }
    if (adminKey) {
      try { setWithdrawals(await api('/api/withdrawals', { headers: { 'x-admin-key': adminKey } })); }
      catch (e) { setMsg(e.message); }
    }
  }, [isOperator, address, adminKey]);

  useEffect(() => { load(); }, [load]);

  if (!isOperator) {
    return <p className="muted">This page is only for the platform operator wallet.</p>;
  }

  function saveKey(e) {
    e.preventDefault();
    sessionStorage.setItem('tch8_admin_key', adminKey);
    load();
  }

  async function resolve(id, status) {
    await api(`/api/complaints/${id}/status`, { method: 'PATCH', body: { requester_address: address, status } });
    load();
  }

  async function payout(id, action) {
    setBusy(`${action}-${id}`);
    setMsg('');
    try {
      await api(`/api/withdrawals/${id}/${action}`, { method: 'POST', headers: { 'x-admin-key': adminKey } });
      await load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="grid gap-10">
      <h1 className="font-display text-3xl">Operator dashboard</h1>
      {msg && <p className="err">{msg}</p>}

      <section>
        <h2 className="font-display text-xl mb-2">Admin key</h2>
        <form onSubmit={saveKey} className="flex gap-2 max-w-md">
          <input type="password" placeholder="ADMIN_KEY from your Render settings" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
          <button className="btn" type="submit">Unlock</button>
        </form>
        <p className="text-xs muted mt-1">Needed to approve payouts. Kept only in this browser tab.</p>
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">Cash-out requests</h2>
        {withdrawals.length === 0 && <p className="muted text-sm">{adminKey ? 'No requests.' : 'Enter the admin key above.'}</p>}
        <div className="grid gap-2">
          {withdrawals.map((w) => (
            <div key={w.id} className="card p-4 flex flex-wrap justify-between gap-3">
              <div className="text-sm">
                <p><b>{w.amount} TCH8</b> → {w.currency} · {shorten(w.wallet_address)}</p>
                <p className="muted">Pay to: {w.account_details}</p>
                <StatusBadge status={w.status} />
              </div>
              {w.status === 'Pending' && (
                <div className="flex gap-2 items-center">
                  <button className="btn btn-green" disabled={Boolean(busy)} onClick={() => payout(w.id, 'complete')}>
                    {busy === `complete-${w.id}` ? 'Working…' : 'Mark paid (burn TCH8)'}
                  </button>
                  <button className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => payout(w.id, 'reject')}>
                    {busy === `reject-${w.id}` ? 'Working…' : 'Reject (return TCH8)'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">Complaints</h2>
        {complaints.length === 0 && <p className="muted text-sm">No complaints.</p>}
        <div className="grid gap-2">
          {complaints.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex justify-between gap-2">
                <p className="font-medium">{c.subject}</p>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs muted">From {shorten(c.wallet_address)}{c.order_id !== null ? ` · order #${c.order_id}` : ''} · {new Date(c.created_at).toLocaleString()}</p>
              <p className="mt-2 text-sm">{c.message}</p>
              <div className="mt-2">
                {c.status === 'Open'
                  ? <button className="btn btn-ghost" onClick={() => resolve(c.id, 'Resolved')}>Mark resolved</button>
                  : <button className="btn btn-ghost" onClick={() => resolve(c.id, 'Open')}>Re-open</button>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
