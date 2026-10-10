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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--color-ink)]/50 border border-[var(--color-line)] rounded-xl border-dashed">
        <p className="text-sm text-[var(--color-muted)] text-center">
          ⚠️ Please connect your wallet to list a product for sale.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-brass)]">
          List an Item for Sale
        </h1>
        <p className="text-xs mt-1 text-[var(--color-muted)] leading-relaxed">
          Listings are stored gas-free — you only interact with the Sepolia smart contract once a buyer initiates an escrow lock.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Item Title</label>
          <input 
            required 
            placeholder="e.g., Rare Genesis Membership Pass" 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors"
          />
        </div>

        {/* Description Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Description</label>
          <textarea 
            placeholder="Describe your item condition, terms, or digital unlock details..." 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            rows={3} 
            className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors resize-none"
          />
        </div>

        {/* Grid for Price and Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Price (TCH8)</label>
            <input 
              required 
              type="number" 
              placeholder="0.00" 
              value={form.price_tch8} 
              onChange={(e) => setForm({ ...form, price_tch8: e.target.value })} 
              className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Display Image URL (Optional)</label>
            <input 
              placeholder="https://example.com" 
              value={form.image_url} 
              onChange={(e) => setForm({ ...form, image_url: e.target.value })} 
              className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors"
            />
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="mt-2">
          <button 
            type="submit" 
            disabled={status === 'saving'}
            className="w-full bg-[var(--color-brass)] text-[var(--color-ink)] font-bold py-3 px-6 rounded-lg text-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 hover:opacity-95 shadow-md"
          >
            {status === 'saving' ? 'Publishing to Database…' : 'List Item Now'}
          </button>
        </div>

        {/* Dynamic Status Badges */}
        {status === 'done' && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 rounded-lg text-xs text-center font-medium animate-fade-in">
            🎉 Item successfully listed! Buyers can now discover it under the Browse tab.
          </div>
        )}
        {status === 'error' && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/40 text-rose-300 rounded-lg text-xs text-center font-medium animate-fade-in">
            ❌ Something went wrong saving your product. Please check your connection and try again.
          </div>
        )}
      </form>
    </div>
  );
}
