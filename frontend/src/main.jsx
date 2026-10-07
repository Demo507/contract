import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi';

import { wagmiConfig } from './wagmiConfig.js';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. Base Privy Configuration Layer */}
    <PrivyProvider
      appId="YOUR_PRIVY_APP_ID" // 💡 Replace with your actual ID from console.privy.io
      config={{
        loginMethods: ['wallet', 'email', 'sms'], // Enables Wallet, Email, and Phone Sign-up
        appearance: { theme: 'light' },
        embeddedWallets: { createOnLogin: 'users-without-wallets' } // Auto-wallet for email/sms users
      }}
    >
      {/* 2. Privy to Wagmi Sync Wrapper Layer */}
      <PrivyWagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </PrivyWagmiProvider>
    </PrivyProvider>
  </React.StrictMode>
);
