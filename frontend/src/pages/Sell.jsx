import { useState } from 'react';
import { useAccount } from 'wagmi';
import { api } from '../lib/api.js';

export default function Sell() {
  const { address } = useAccount();
  const [form, setForm] = useState({ title: '', description: '', price_tch8: '', image_url: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setStatus('saving');
    setError('');
    try {
      await api('/api/products', { method: 'POST', body: { ...form, seller_address: address } });
      setStatus('done');
      setForm({ title: '', description: '', price_tch8: '', image_url: '' });
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-1">List an item</h1>
      <p className="text-sm muted mb-6">Listing is free. You are paid in TCH8 once the buyer confirms delivery.</p>
      <form onSubmit={submit} className="grid gap-3">
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input required type="number" min="0" step="any" placeholder="Price in TCH8" value={form.price_tch8} onChange={(e) => setForm({ ...form, price_tch8: e.target.value })} />
        <input placeholder="Image URL (optional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <button className="btn" type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'List item'}</button>
        {status === 'done' && <p className="ok">Listed. You can see it on the Browse page.</p>}
        {status === 'error' && <p className="err">{error}</p>}
      </form>
    </div>
  );
}
