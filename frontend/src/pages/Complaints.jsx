import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { BACKEND_URL, OPERATOR_ADDRESS } from '../contracts/addresses.js';

export default function Complaints() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState({ order_id: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [list, setList] = useState([]);

  // Safety condition separating client submission views from master administrator records
  const isOperator = isConnected && address?.toLowerCase() === OPERATOR_ADDRESS?.toLowerCase();

  async function loadComplaints() {
    if (!isOperator) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/complaints?requester_address=${address}`);
      if (res.ok) setList(await res.json());
    } catch (err) {
      console.error('Failed to load incoming support logs:', err);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [isOperator, address]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch(`${BACKEND_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, ...form }),
      });
      if (!res.ok) throw new Error('Submission failed');

      setStatus('done');
      setForm({ order_id: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--color-ink)]/50 border border-[var(--color-line)] rounded-xl border-dashed">
        <p className="text-sm text-[var(--color-muted)] text-center">
          ⚠️ Please connect your wallet first to submit support logs or view tickets.
        </p>
      </div>
    );
  }

  // 1. MASTER OPERATOR VIEW PANEL (Only renders for matching OPERATOR_ADDRESS)
  if (isOperator) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--color-brass)] flex items-center gap-2">
            🛡️ Complaints Inbox <span className="text-xs font-mono font-normal text-gray-400 bg-[var(--color-ink)]/80 border border-[var(--color-line)] px-2 py-0.5 rounded-full">Operator Mode</span>
          </h1>
          <p className="text-xs text-[var(--color-muted)]">Master administrative dashboard view for inspecting platform disputes and marketplace tickets.</p>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl p-12 text-center bg-[var(--color-ink)]/30 border border-[var(--color-line)] border-dashed">
            <span className="text-3xl block mb-2">✅</span>
            <h3 className="font-display font-semibold text-base text-[var(--color-text)]">All Clear!</h3>
            <p className="text-xs text-[var(--color-muted)]">No network complaints or disputes have been filed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((c) => (
              <div 
                key={c.id} 
                className="bg-[var(--color-surface)] border border-[var(--color-line)] p-4 rounded-xl shadow-md flex flex-col justify-between gap-3 hover:border-gray-700 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 border-b border-[var(--color-line)] pb-2 mb-2">
                    <h3 className="font-bold text-sm text-white truncate" title={c.subject}>
                      {c.subject}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-950/40 border border-yellow-800/40 text-yellow-400 whitespace-nowrap">
                      {c.status || 'Open'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-0.5 text-[11px] font-mono text-[var(--color-muted)]">
                    <p className="truncate">From: <span className="text-gray-300">{c.wallet_address}</span></p>
                    {c.order_id && (
                      <p>Linked context: <span className="text-[var(--color-brass)] font-bold">Order #{c.order_id}</span></p>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-gray-200 bg-[var(--color-ink)]/40 p-3 rounded-lg border border-[var(--color-line)] whitespace-pre-wrap leading-relaxed">
                    {c.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. STANDARD CLIENT VIEW PANEL (Renders for every other user address)
  return (
    <div className="max-w-xl mx-auto bg-[var(--color-surface)] border border-[var(--color-line)] p-5 rounded-xl shadow-xl">
      <div className="mb-5">
        <h1 className="font-display text-xl font-bold text-[var(--color-brass)]">File a Complaint</h1>
        <p className="text-xs mt-1 text-[var(--color-muted)] leading-relaxed">
          Encountered a problem with a delivery, escrow timeline, or marketplace payment? 
          Submit details below. Your message is encrypted and completely hidden from the public—visible **only to the system operator**.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Optional Order ID Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Associated Order ID (Optional)</label>
          <input 
            type="number"
            placeholder="e.g., 1042" 
            value={form.order_id} 
            onChange={(e) => setForm({ ...form, order_id: e.target.value })}
            className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors"
          />
        </div>

        {/* Subject Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Subject Heading</label>
          <input 
            required 
            placeholder="Briefly state the primary issue" 
            value={form.subject} 
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors"
          />
        </div>

        {/* Message Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider">Detailed Description</label>
          <textarea 
            required 
            placeholder="Please detail your grievance, transaction timelines, and any context that will help the operator resolve your problem smoothly..." 
            rows={4} 
            value={form.message} 
            onChange={(e) => setForm({ ...form, message: e.target.value })} 
            className="w-full text-sm p-3 rounded-lg bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Submit Button Action */}
        <div className="mt-2">
          <button 
            type="submit" 
            disabled={status === 'saving'}
            className="w-full bg-[var(--color-brass)] text-[var(--color-ink)] font-bold py-3 px-6 rounded-lg text-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 hover:opacity-95 shadow-md"
          >
            {status === 'saving' ? 'Submitting Log...' : 'File Secure Complaint'}
          </button>
        </div>

        {/* Action Status Badges */}
        {status === 'done' && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 rounded-lg text-xs text-center font-medium">
            🎉 Complaint securely dispatched to the platform administrator.
          </div>
        )}
        {status === 'error' && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/40 text-rose-300 rounded-lg text-xs text-center font-medium">
            ❌ Transmission error. Please verify database parameters.
          </div>
        )}
      </form>
    </div>
  );
}
