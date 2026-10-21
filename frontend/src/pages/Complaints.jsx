import { useState } from 'react';
import { useAccount } from 'wagmi';
import { api } from '../lib/api.js';

export default function Complaints() {
  const { address } = useAccount();
  const [form, setForm] = useState({ order_id: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setStatus('saving');
    setError('');
    try {
      await api('/api/complaints', { method: 'POST', body: { wallet_address: address, ...form } });
      setStatus('done');
      setForm({ order_id: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-1">Lodge a complaint</h1>
      <p className="text-sm muted mb-6">Only the platform operator can read your complaint.</p>
      <form onSubmit={submit} className="grid gap-3">
        <input type="number" min="0" placeholder="Order number (optional)" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} />
        <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <textarea required rows={4} placeholder="Tell us what happened" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <button className="btn" type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Sending…' : 'Submit complaint'}</button>
        {status === 'done' && <p className="ok">Complaint sent. The operator will look into it.</p>}
        {status === 'error' && <p className="err">{error}</p>}
      </form>
    </div>
  );
}
