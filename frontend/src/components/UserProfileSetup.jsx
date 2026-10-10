import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { BACKEND_URL } from '../contracts/addresses.js';

export default function UserProfileSetup({ onComplete }) {
  const { address, isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ display_name: '', email: '', phone: '', date_of_birth: '', country: 'NG' });
  const [status, setStatus] = useState('idle'); // idle, saving, error

  useEffect(() => {
    if (isConnected && address) {
      // Check if user profile data is already complete in database indices
      fetch(`${BACKEND_URL}/api/users/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address })
      })
      .then(res => res.json())
      .then(user => {
        if (user && !user.is_profile_complete) {
          setIsOpen(true);
        } else if (onComplete) {
          onComplete(user);
        }
      })
      .catch(err => console.error("Onboarding gate failed:", err));
    }
  }, [isConnected, address]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address) return;
    setStatus('saving');

    try {
      const res = await fetch(`${BACKEND_URL}/api/users/profile/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error("Onboarding write payload rejected.");
      
      const data = await res.json();
      setStatus('idle');
      setIsOpen(false);
      if (onComplete) onComplete(data.user[0]);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6">
        <div className="mb-5 text-center">
          <span className="text-3xl">🛡️</span>
          <h2 className="font-display text-xl font-bold text-[var(--color-brass)] mt-2">Complete Your Identity</h2>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            To use the TCH8 secure escrow marketplace, please link your standard account credentials. This data is private.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)]">Full Name</label>
            <input required type="text" placeholder="John Doe" value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} className="w-full text-xs p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)]" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)]">Email Address</label>
            <input required type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full text-xs p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)]">Date of Birth</label>
              <input required type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="w-full text-xs p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] select-none" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)]">Country</label>
              <select value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="w-full text-xs p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] cursor-pointer">
                <option value="NG">Nigeria (NG)</option>
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={status === 'saving'} className="w-full bg-[var(--color-brass)] text-[var(--color-ink)] font-bold py-3 rounded-lg text-xs mt-2 uppercase tracking-wider transition active:scale-95 disabled:opacity-50">
            {status === 'saving' ? 'Verifying & Saving...' : 'Initialize Onboarding'}
          </button>

          {status === 'error' && (
            <p className="text-red-400 text-[10px] text-center">❌ Onboarding failed. Check parameters and try again.</p>
          )}
        </form>
      </div>
    </div>
  );
}
