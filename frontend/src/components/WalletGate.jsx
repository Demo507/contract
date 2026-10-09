import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import ConnectWallet from './ConnectWallet.jsx';
import { BACKEND_URL } from '../contracts/addresses.js';

export default function WalletGate({ children }) {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState({ display_name: '', email: '', phone: '' });
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      fetch(`${BACKEND_URL}/api/users/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address }),
      }).then(() => setRegistered(true)).catch((err) => console.error('Registration failed', err));
    } else {
      setRegistered(false);
    }
  }, [isConnected, address]);

  async function saveProfile(e) {
    e.preventDefault();
    await fetch(`${BACKEND_URL}/api/users/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: address, ...profile }),
    });
  }

  if (!isConnected) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
        background: 'var(--color-ink)', color: 'var(--color-text)', padding: '1.5rem', textAlign: 'center',
      }}>
        <h1 className="font-display" style={{ fontSize: '2.5rem' }}>TCH8</h1>
        <p style={{ color: 'var(--color-muted)', maxWidth: '360px' }}>
          Sign up by connecting your wallet to start buying, selling, and trading TCH8.
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <>
      {registered && (
        <div className="max-w-md mx-auto px-6 pt-4">
          <details>
            <summary className="text-sm cursor-pointer" style={{ color: 'var(--color-muted)' }}>
              Add contact info (optional)
            </summary>
            <form onSubmit={saveProfile} className="flex flex-col gap-2 mt-2">
              <input placeholder="Display name" value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
              <input placeholder="Email" value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              <input placeholder="Phone" value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              <button type="submit">Save</button>
            </form>
          </details>
        </div>
      )}
      {children}
    </>
  );
}