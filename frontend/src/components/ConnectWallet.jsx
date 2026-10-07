import React, { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

export default function ConnectWallet() {
  const { login, authenticated, user } = usePrivy();
  const { address: walletAddress } = useAccount();

  useEffect(() => {
    if (authenticated && walletAddress) {
      // Sync user profile to Supabase via Render
      fetch("https://onrender.com", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          email: user?.email?.address || null,
          phone: user?.phone?.number || null
        })
      }).catch(err => console.error("Profile sync failed:", err));
    }
  }, [authenticated, walletAddress, user]);

  return (
    <div>
      {/* Keep your existing login button/wallet UI here */}
      {!authenticated ? (
        <button onClick={login} className="text-sm px-4 py-2 bg-[var(--color-brass)] text-black rounded font-medium">
          Sign In
        </button>
      ) : (
        <span className="text-sm text-[var(--color-muted)]">
          {walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "Connected"}
        </span>
      )}
    </div>
  );
}
