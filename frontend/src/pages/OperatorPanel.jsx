import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { BACKEND_URL, OPERATOR_ADDRESS } from '../contracts/addresses.js';

export default function OperatorPanel() {
  const { address, isConnected } = useAccount();
  const [complaints, setComplaints] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [activeActionId, setActiveActionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOperator = isConnected && address?.toLowerCase() === OPERATOR_ADDRESS.toLowerCase();

  const loadMasterData = async () => {
    if (!isOperator) return;
    try {
      const [complaintsRes, redemptionsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/complaints?requester_address=${address}`),
        fetch(`${BACKEND_URL}/api/redemptions`)
      ]);
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());
      if (redemptionsRes.ok) setRedemptions(await redemptionsRes.json());
    } catch (err) {
      console.error("Master administrative index retrieval failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, [isOperator, address]);

  const handleProcessRedemption = async (id, action) => {
    setActiveActionId(`${id}-${action}`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/redemptions/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        alert(`Redemption ${action}ed successfully on-chain!`);
        loadMasterData();
      } else {
        const errorData = await res.json();
        alert(`Operation failed: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveActionId(null);
    }
  };

  if (!isOperator) {
    return (
      <div className="p-8 text-center bg-red-950/20 border border-red-900/40 rounded-xl max-w-md mx-auto">
        <span className="text-2xl">⚠️</span>
        <h2 className="text-sm font-bold text-red-400 mt-1 uppercase tracking-wider">Access Restriced</h2>
        <p className="text-xs text-red-200/70 mt-1">This module is reserved for the platform operator address key container configuration.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
      {/* HEADER STATEMENT PANEL */}
      <div className="xl:col-span-3 bg-yellow-950/10 border border-yellow-700/20 p-5 rounded-xl flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--color-brass)] uppercase tracking-wide">Platform Command Operations Center</h1>
          <p className="text-xs text-[var(--color-muted)]">Real-time processing panel managing support complaints and automated smart contract redemptions.</p>
        </div>
        <button onClick={loadMasterData} className="px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-line)] text-white hover:border-gray-500 rounded-lg text-xs font-mono">
          🔄 Refresh Feeds
        </button>
      </div>

      {/* BLOCK LEFT: PENDING REDEMPTION QUEUE (2 Columns) */}
      <div className="xl:col-span-2 bg-[var(--color-surface)] border border-[var(--color-line)] p-5 rounded-xl shadow-xl">
        <h2 className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider mb-4">On-Chain Redemption Authorizations ({redemptions.length})</h2>
        
        {loading ? (
          <p className="text-xs text-[var(--color-muted)] font-mono animate-pulse">Querying automated ledger indices...</p>
        ) : redemptions.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)] py-6 text-center border border-dashed border-[var(--color-line)] rounded-xl">No active redemptions logged.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {redemptions.map((r) => (
              <div key={r.redemption_id} className="p-4 bg-[var(--color-ink)]/40 border border-[var(--color-line)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-white font-mono">ID Reference: #{r.redemption_id}</p>
                  <p className="text-[11px] text-[var(--color-muted)] truncate max-w-[250px] mt-0.5">Vendor: {r.seller_address}</p>
                  <span className="inline-block mt-2 font-mono text-xs font-bold bg-yellow-950/40 text-[var(--color-brass)] border border-yellow-800/30 px-2 py-0.5 rounded">
                    {formatUnits(BigInt(r.amount), 18)} TCH8
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {r.status === 'Pending' ? (
                    <>
                      <button 
                        disabled={activeActionId !== null}
                        onClick={() => handleProcessRedemption(r.redemption_id, 'confirm')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-md shadow disabled:opacity-40"
                      >
                        {activeActionId === `${r.redemption_id}-confirm` ? 'Mining...' : 'Confirm'}
                      </button>
                      <button 
                        disabled={activeActionId !== null}
                        onClick={() => handleProcessRedemption(r.redemption_id, 'reject')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-md shadow disabled:opacity-40"
                      >
                        {activeActionId === `${r.redemption_id}-reject` ? 'Slashed...' : 'Reject'}
                      </button>
                    </>
                  ) : (
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                      r.status === 'Completed' ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-400' : 'bg-rose-950/50 border border-rose-800 text-rose-400'
                    }`}>
                      {r.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BLOCK RIGHT: SYSTEM DISPUTES & COMPLAINTS INBOX (1 Column) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-5 rounded-xl shadow-xl flex flex-col">
        <h2 className="text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider mb-4">Support & Dispute Tickets ({complaints.length})</h2>
        
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[450px] pr-1">
          {complaints.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)] text-center py-8 font-mono">Dispute inbox empty.</p>
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="p-3.5 bg-[var(--color-ink)]/50 border border-[var(--color-line)] rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-start border-b border-[var(--color-line)] pb-1.5">
                  <h4 className="font-bold text-xs text-white truncate max-w-[150px]">{c.subject}</h4>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-yellow-400 font-mono bg-yellow-950/40 px-1.5 rounded border border-yellow-800/30">{c.status}</span>
                </div>
                <p className="text-[10px] text-[var(--color-muted)] font-mono truncate">Wallet: {c.wallet_address}</p>
                {c.order_id && <p className="text-[10px] font-bold text-[var(--color-brass)] font-mono">Linked Order Context: #{c.order_id}</p>}
                <p className="text-xs text-gray-300 leading-relaxed bg-[var(--color-surface)] p-2 rounded border border-[var(--color-line)] whitespace-pre-wrap">{c.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
