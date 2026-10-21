import { useEffect, useState } from 'react';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { api } from '../lib/api.js';
import { AUTH_KEY, LOGOUT_EVENT } from '../lib/auth.js';

// Nobody gets past this screen until they (1) connect a wallet and (2) sign a free message.
export default function WalletGate({ children }) {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const [verified, setVerified] = useState(() => localStorage.getItem(AUTH_KEY));
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ display_name: '', email: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    const reset = () => setVerified(null);
    window.addEventListener(LOGOUT_EVENT, reset);
    return () => window.removeEventListener(LOGOUT_EVENT, reset);
  }, []);

  const authed = Boolean(isConnected && address && verified === address.toLowerCase());

  async function signIn(addr) {
    setBusy('Preparing login…');
    const { nonce } = await api('/api/users/nonce', { method: 'POST', body: { wallet_address: addr } });
    setBusy('Approve the signature request in your wallet…');
    const signature = await signMessageAsync({ message: nonce });
    setBusy('Checking signature…');
    await api('/api/users/verify', { method: 'POST', body: { wallet_address: addr, signature } });
    localStorage.setItem(AUTH_KEY, addr.toLowerCase());
    setVerified(addr.toLowerCase());
  }

  async function handleLogin(connector) {
    setError('');
    try {
      let addr = address;
      if (!isConnected) {
        setBusy('Connecting wallet…');
        const result = await connectAsync({ connector });
        addr = result.accounts[0]; // address straight from the connection (never stale)
      }
      if (!addr) throw new Error('Could not read your wallet address. Unlock your wallet and try again.');
      await signIn(addr);
    } catch (e) {
      const text = `${e?.shortMessage || ''} ${e?.message || ''}`;
      setError(/rejected|denied/i.test(text) ? 'You cancelled the request in your wallet.' : (e.shortMessage || e.message));
    } finally {
      setBusy('');
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      await api('/api/users/connect', { method: 'POST', body: { wallet_address: address, ...profile } });
      setProfileMsg('Saved.');
    } catch (err) {
      setProfileMsg(err.message);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-display text-4xl">TCH8</h1>
        <p className="muted max-w-sm">
          Sign up or log in by connecting your wallet and signing one free message. No password, no gas fee.
        </p>

        {isConnected ? (
          <button className="btn" disabled={Boolean(busy)} onClick={() => handleLogin(null)}>
            {busy || 'Sign message to continue'}
          </button>
        ) : (
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {connectors.map((c) => (
              <button key={c.uid} className="btn" disabled={Boolean(busy)} onClick={() => handleLogin(c)}>
                {busy || (c.id === 'walletConnect' ? 'Mobile wallet (WalletConnect)' : 'Browser wallet (MetaMask)')}
              </button>
            ))}
          </div>
        )}

        {error && <p className="err max-w-sm">{error}</p>}
        <p className="text-xs muted max-w-sm">
          On a phone? Choose "Mobile wallet", or open this page inside your wallet app's browser and choose "Browser wallet".
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3">
        <details>
          <summary className="text-xs muted cursor-pointer">Add contact info (optional)</summary>
          <form onSubmit={saveProfile} className="grid gap-2 mt-2 max-w-sm">
            <input placeholder="Display name" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
            <input placeholder="Email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <input placeholder="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            <button className="btn" type="submit">Save</button>
            {profileMsg && <span className="text-xs muted">{profileMsg}</span>}
          </form>
        </details>
      </div>
      {children}
    </>
  );
}
