import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { BACKEND_URL, OPERATOR_ADDRESS } from '../contracts/addresses.js';

export default function Complaints() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState({ order_id: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [list, setList] = useState([]);

  const isOperator = isConnected && address?.toLowerCase() === OPERATOR_ADDRESS.toLowerCase();

  async function loadComplaints() {
    if (!isOperator) return;
    const res = await fetch(`${BACKEND_URL}/api/complaints?requester_address=${address}`);
    if (res.ok) setList(await res.json());
  }
  useEffect(() => { loadComplaints(); }, [isOperator, address]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('saving');
    try {
      await fetch(`${BACKEND_URL}/api/complaints`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, ...form }),
      });
      setStatus('done');
      setForm({ order_id: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  if (!isConnected) return <p style={{ color: 'var(--color-muted)' }}>Connect your wallet first.</p>;

  if (isOperator) {
    return (
      <div>
        <h1 className="font-display text-3xl mb-6">Complaints (Operator view)</h1>
        {list.length === 0 ? <p style={{ color: 'var(--color-muted)' }}>No complaints filed.</p> : (
          <div className="flex flex-col gap-3">
            {list.map((c) => (
              <div key={c.id} style={{ border: '1px solid var(--color-line)', borderRadius: '8px', padding: '1rem' }}>
                <p className="font-medium">{c.subject} — {c.status}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>From: {c.wallet_address} {c.order_id ? `(Order #${c.order_id})` : ''}</p>
                <p className="mt-2">{c.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-1">File a complaint</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>Your complaint is only visible to the platform operator.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input placeholder="Order # (optional)" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} />
        <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <textarea required placeholder="Describe the issue" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <button type="submit" disabled={status === 'saving'} style={{ background: 'var(--color-brass)' }} className="px-4 py-2.5 rounded text-sm font-medium text-[var(--color-ink)]">
          {status === 'saving' ? 'Submitting...' : 'Submit complaint'}
        </button>
        {status === 'done' && <p style={{ color: 'var(--color-release)' }}>Complaint submitted.</p>}
      </form>
    </div>
  );
}