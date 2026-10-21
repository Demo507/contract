import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, parseEventLogs } from 'viem';
import { TCH8_ADDRESS, ESCROW_ADDRESS, TOKEN_DECIMALS } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';
import { escrowAbi } from '../contracts/escrowAbi.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useTx, friendlyError } from '../lib/useTx.js';
import { api } from '../lib/api.js';

export default function Exchange() {
  const { address } = useAccount();
  const { send, refresh, publicClient } = useTx();
  const [form, setForm] = useState({ amount: '', currency: 'NGN', account_details: '' });
  const [list, setList] = useState([]);
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    if (!address) return;
    try { setList(await api(`/api/withdrawals?wallet=${address.toLowerCase()}`)); } catch { /* shown elsewhere */ }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const amount = parseUnits(form.amount, TOKEN_DECIMALS);
      const balance = await publicClient.readContract({ address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'balanceOf', args: [address] });
      if (balance < amount) { setStatus('error'); setMsg('You do not have that much TCH8.'); return; }

      // 1) Lock your TCH8 in escrow (your wallet -> escrow). This is the only time money leaves a seller wallet.
      setStatus('locking');
      const allowance = await publicClient.readContract({ address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'allowance', args: [address, ESCROW_ADDRESS] });
      if (allowance < amount) {
        await send({ address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'approve', args: [ESCROW_ADDRESS, amount] });
      }
      const { receipt } = await send({ address: ESCROW_ADDRESS, abi: escrowAbi, functionName: 'requestRedemption', args: [amount] });
      const logs = parseEventLogs({ abi: escrowAbi, logs: receipt.logs, eventName: 'RedemptionRequested' });
      const redemption_id = logs[0] ? Number(logs[0].args.redemptionId) : null;

      // 2) Tell the platform where to send the money
      setStatus('recording');
      await api('/api/withdrawals', {
        method: 'POST',
        body: { wallet_address: address, amount: form.amount, currency: form.currency, account_details: form.account_details, redemption_id },
      });

      setStatus('done');
      setForm({ amount: '', currency: 'NGN', account_details: '' });
      refresh();
      load();
    } catch (err) {
      setStatus('error');
      setMsg(friendlyError(err));
    }
  }

  async function cancel(id) {
    setCancelling(id);
    setMsg('');
    try {
      await api(`/api/withdrawals/${id}/cancel`, { method: 'POST', body: { wallet_address: address } });
      refresh();
      await load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setCancelling(null);
    }
  }

  const canCancel = (w) => w.status === 'Pending' && new Date() < new Date(w.cancel_deadline);
  const working = status === 'locking' || status === 'recording';

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-1">Exchange TCH8 for real money</h1>
      <p className="text-sm muted mb-6">
        Money lands in your account within 48–96 hours. You can cancel within 24 hours and your TCH8 is returned.
      </p>

      <form onSubmit={submit} className="grid gap-3">
        <input required type="number" min="0" step="any" placeholder="Amount in TCH8" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
          <option value="NGN">NGN (Naira)</option>
          <option value="USD">USD</option>
        </select>
        <input required placeholder="Bank name + account number" value={form.account_details} onChange={(e) => setForm({ ...form, account_details: e.target.value })} />
        <button className="btn" type="submit" disabled={working}>
          {status === 'locking' ? 'Confirm in your wallet…' : status === 'recording' ? 'Saving request…' : 'Exchange'}
        </button>
        {status === 'done' && <p className="ok">Request received. Expect your money within 48–96 hours.</p>}
        {msg && <p className="err">{msg}</p>}
      </form>

      <h2 className="font-display text-xl mt-8 mb-3">Your requests</h2>
      {list.length === 0 && <p className="muted text-sm">No requests yet.</p>}
      <div className="grid gap-2">
        {list.map((w) => (
          <div key={w.id} className="card p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p>{w.amount} TCH8 → {w.currency}</p>
              <StatusBadge status={w.status} />
              <p className="text-xs muted mt-1">Expected by {new Date(w.expected_at).toLocaleString()}</p>
            </div>
            {canCancel(w) && (
              <button className="btn btn-ghost" disabled={cancelling === w.id} onClick={() => cancel(w.id)}>
                {cancelling === w.id ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
