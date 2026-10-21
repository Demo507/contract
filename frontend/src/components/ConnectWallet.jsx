import { useAccount, useDisconnect } from 'wagmi';
import { shorten } from '../lib/format.js';
import { logout } from '../lib/auth.js';

// Header chip: shows the logged-in wallet and a Disconnect button.
export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-2 card px-3 py-1.5">
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-release)' }} />
      <span className="text-xs font-mono">{shorten(address)}</span>
      <button
        className="text-xs"
        style={{ color: '#f1948a' }}
        onClick={() => { logout(); disconnect(); }}
      >
        Disconnect
      </button>
    </div>
  );
}
