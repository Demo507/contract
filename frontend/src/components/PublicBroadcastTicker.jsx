import { useState, useEffect } from 'react';

export default function PublicBroadcastTicker() {
  const [showLogs, setShowLogs] = useState(false);
  const [broadcasts, setBroadcasts] = useState([
    { id: 1, text: "🎉 Address 0x4a...29c Bought 5,000 TCH8 Tokens", time: "Just now" },
    { id: 2, text: "📦 Item #1042 'Genesis Artifact' Listed on Marketplace", time: "2 mins ago" },
    { id: 3, text: "🤝 Item #912 Sold to 0x8b...11a for 450 TCH8", time: "10 mins ago" }
  ]);

  return (
    <>
      {/* INFINITE MOVING MARQUEE BANNER */}
      <div className="w-full bg-yellow-950/30 border-b border-yellow-700/20 text-yellow-200 text-xs py-2 px-4 flex items-center overflow-hidden relative group">
        
        {/* BUTTON TO ENTER CHANNELS */}
        <button 
          onClick={() => setShowLogs(true)}
          className="z-10 bg-yellow-700 hover:bg-yellow-600 text-yellow-950 font-bold px-2 py-0.5 rounded mr-4 shadow whitespace-nowrap text-[11px] transition-transform active:scale-95"
        >
          📋 Broadcast Logs
        </button>

        {/* SLIDING CONTEXT TAPE TRACK */}
        <div className="flex gap-16 animate-marquee whitespace-nowrap will-change-transform py-0.5">
          {broadcasts.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              {b.text} <span className="text-yellow-200/50 font-mono text-[10px]">({b.time})</span>
            </span>
          ))}
          {/* Duplicated set for seamless loops without breaks */}
          {broadcasts.map((b) => (
            <span key={`dup-${b.id}`} className="inline-flex items-center gap-2" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              {b.text} <span className="text-yellow-200/50 font-mono text-[10px]">({b.time})</span>
            </span>
          ))}
        </div>
      </div>

      {/* POPUP BROADCAST DIALOG LOG PANEL */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--color-line)] flex justify-between items-center bg-[var(--color-ink)]">
              <h3 className="font-bold text-sm text-[var(--color-brass)]">Public Network Activity Feed</h3>
              <button 
                onClick={() => setShowLogs(false)}
                className="text-xs text-[var(--color-muted)] hover:text-white transition"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2 max-h-[350px] overflow-y-auto bg-[var(--color-ink)]/50">
              {broadcasts.map((b) => (
                <div key={`log-${b.id}`} className="p-3 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg text-xs flex justify-between gap-4">
                  <span className="text-gray-200">{b.text}</span>
                  <span className="text-[var(--color-muted)] font-mono whitespace-nowrap">{b.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Embedded style element supporting marquee tape looping parameters */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
}
