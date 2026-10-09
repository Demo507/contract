import { useState } from 'react';
import { useAccount } from 'wagmi';
import { BACKEND_URL } from '../contracts/addresses.js';

export default function Sell() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState({ title: '', description: '', price_tch8: '', image_url: '' });
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isConnected) return;
    setStatus('saving');
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, seller_address: address }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('done');
      setForm({ title: '', description: '', price_tch8: '', image_url: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  if (!isConnected) return <p style={{ color: 'var(--color-muted)' }}>Connect your wallet to list a product.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl mb-1">List an item</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>Listings are free — you only pay gas when a buyer's payment is released to you.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <input required type="number" placeholder="Price in TCH8" value={form.price_tch8} onChange={(e) => setForm({ ...form, price_tch8: e.target.value })} />
        <input placeholder="Image URL (optional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <button type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'List item'}</button>
        {status === 'done' && <p style={{ color: 'var(--color-release)' }}>Listed. Find it under Browse.</p>}
        {status === 'error' && <p style={{ color: 'var(--color-danger)' }}>Something went wrong.</p>}
      </form>
    </div>
  );
}