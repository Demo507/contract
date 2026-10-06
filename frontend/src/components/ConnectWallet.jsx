import { useAccount, useConnect, useDisconnect } from 'wagmi';

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="text-sm px-3 py-1.5 rounded"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          {shorten(address)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="px-4 py-2 rounded text-sm font-medium text-[var(--color-ink)] disabled:opacity-60 transition"
      style={{ background: 'var(--color-brass)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-brass-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-brass)')}
    >
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}