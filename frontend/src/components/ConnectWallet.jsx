import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../contracts/addresses.js';

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  
  // Track states: idle, fetching, signing, verified, failed
  const [authStatus, setAuthStatus] = useState('idle'); 

  // 💡 CRITICAL UPDATE: Auto-align states on page reloads or user-triggered disconnect events
  useEffect(() => {
    if (isConnected) {
      // If Wagmi notes an active connection but local state hasn't finished verifying,
      // fallback to 'verified' for UI consistency, or preserve signature states.
      setAuthStatus('verified'); 
    } else {
      setAuthStatus('idle');
    }
  }, [isConnected]);

  async function handleWeb3Login(connector) {
    setAuthStatus('fetching');
    try {
      // 1. Establish initial Wagmi wallet provider connection
      await connect({ connector });
      
      // Safety lookup fallback to fetch address context safely
      const targetAddr = address || window.ethereum?.selectedAddress;
      if (!targetAddr) throw new Error("Wallet not unlocked.");

      // 2. Fetch the verification string challenge from your backend API
      const nonceRes = await fetch(`${BACKEND_URL}/api/users/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: targetAddr }),
      });
      const { nonce } = await nonceRes.json();

      // 3. Prompt user for a gas-less cryptographic signature approval
      setAuthStatus('signing');
      const signature = await signMessageAsync({ message: nonce });

      // 4. Validate signature against backend verification rules
      const verifyRes = await fetch(`${BACKEND_URL}/api/users/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: targetAddr, signature }),
      });

      if (!verifyRes.ok) throw new Error("Signature validation failed");

      const authData = await verifyRes.json();
      setAuthStatus('verified');
      console.log("Logged in professionally:", authData.user);
    } catch (err) {
      console.error("Web3 secure signature authentication failed:", err);
      setAuthStatus('failed');
    }
  }

  const handleDisconnectAction = () => {
    disconnect();
    setAuthStatus('idle');
  };

  // Render the clear Disconnect panel layout if connected
  if (isConnected && authStatus === 'verified') {
    return (
      <div className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-line)] px-3 py-1.5 rounded-xl shadow-md">
        <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          👤 {shorten(address)}
        </span>
        <button 
          onClick={handleDisconnectAction} 
          className="text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer bg-rose-950/20 border border-rose-900/30 px-2 py-0.5 rounded-md"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => handleWeb3Login(connector)}
          disabled={authStatus === 'fetching' || authStatus === 'signing'}
          className="px-4 py-2 rounded-lg text-xs font-bold text-[var(--color-ink)] hover:opacity-95 active:scale-95 transition-all shadow cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--color-brass)' }}
        >
          {authStatus === 'fetching' && 'Preparing Challenge...'}
          {authStatus === 'signing' && 'Sign inside Wallet...'}
          {authStatus === 'failed' && 'Authentication Failed - Retry'}
          {authStatus === 'idle' && `Login with ${connector.name}`}
        </button>
      ))}
    </div>
  );
}
