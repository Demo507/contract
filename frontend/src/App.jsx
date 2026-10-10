import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { OPERATOR_ADDRESS } from './contracts/addresses.js';

// Component Imports
import ConnectWallet from './components/ConnectWallet.jsx';
import TokenBalance from './components/TokenBalance.jsx';
import SupplyStats from './components/SupplyStats.jsx';
import RegisteredUsers from './components/RegisteredUsers.jsx';
import WalletGate from './components/WalletGate.jsx';
import MarketplaceHistory from './components/MarketplaceHistory.jsx';
import PublicBroadcastTicker from './components/PublicBroadcastTicker.jsx';
import StatsDashboard from './components/StatsDashboard.jsx';
import TransferTokenWidget from './components/TransferTokenWidget.jsx';
import UserProfileSetup from './components/UserProfileSetup.jsx'; 

// Page Imports
import Marketplace from './pages/Marketplace.jsx';
import MyOrders from './pages/MyOrders.jsx';
import MySales from './pages/MySales.jsx';
import Sell from './pages/Sell.jsx';
import BuyTCH8 from './pages/BuyTCH8.jsx';
import Exchange from './pages/Exchange.jsx';
import Complaints from './pages/Complaints.jsx';
import OperatorPanel from './pages/OperatorPanel.jsx';

function AppContent() {
  const { address: currentConnectedAddress, isConnected } = useAccount();

  // Strict evaluation confirming if the connected wallet address matches the administrator key
  const isOperator = isConnected && currentConnectedAddress?.toLowerCase() === OPERATOR_ADDRESS?.toLowerCase();

  return (
    <div className="min-h-screen text-[var(--color-text)] flex flex-col font-sans" style={{ background: 'var(--color-ink)' }}>
      
      {/* 🔒 CRYPTOGRAPHIC WEB3 ACCOUNT IDENTITY COMPLIANCE MODAL LAYER */}
      <UserProfileSetup onComplete={(user) => console.log("Account context loaded:", user)} />

      {/* 1. LIVE MOVING TICKER (Marquee style broadcast) */}
      <PublicBroadcastTicker />

      {/* HEADER BLOCK */}
      <header className="border-b" style={{ borderColor: 'var(--color-line)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-[var(--color-brass)]">
            TCH8 Portal
          </Link>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="hidden md:flex gap-3 items-center bg-[var(--color-surface)] p-1.5 rounded-lg border border-[var(--color-line)] text-xs">
              <RegisteredUsers />
              <SupplyStats />
              <TokenBalance />
              
              {/* 👑 SECURE HEADER NAVBAR LINK INDICATOR */}
              {isOperator && (
                <Link 
                  to="/operator" 
                  className="ml-2 px-2.5 py-1 rounded bg-yellow-950/50 border border-yellow-700/40 text-[var(--color-brass)] font-mono font-bold tracking-tight hover:bg-yellow-900/60 transition-all flex items-center gap-1.5 animate-pulse"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brass)] inline-block"></span>
                  Admin Console
                </Link>
              )}
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID CONTAINER */}
      <div className="max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* LEFT COLUMN: NAVIGATION BOX SQUARES (4 Cols) */}
        <nav className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 h-fit">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 text-xs uppercase font-semibold text-[var(--color-muted)] tracking-wider px-1 mb-1 hidden lg:block">
            Applications & Navigation
          </div>
          <GridNavButton to="/" title="Browse" desc="Marketplace Items" icon="🌐" />
          <GridNavButton to="/buy" title="Buy TCH8" desc="Acquire Tokens" icon="🪙" />
          <GridNavButton to="/sell" title="Sell" desc="List Assets" icon="🏷️" />
          <GridNavButton to="/orders" title="My Orders" desc="Purchase logs" icon="📦" />
          <GridNavButton to="/sales" title="My Sales" desc="Earning history" icon="📈" />
          <GridNavButton to="/exchange" title="Exchange" desc="Swap Pairs" icon="💱" />
          <GridNavButton to="/complaints" title="Complaints" desc="Support center" icon="🛡️" />
          
          {/* 👑 SIDEBAR NAVIGATION SQUARE BLOCK LINK */}
          {isOperator && (
            <GridNavButton 
              to="/operator" 
              title="Admin Panel" 
              desc="Manage operations" 
              icon="⚙️" 
            />
          )}
        </nav>

        {/* MAIN UTILITY COLUMN: (9 Cols) */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          
          {/* USER SYSTEM CONTROL PANELS */}
          {isConnected && currentConnectedAddress && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Analytics Timeframe Blocks */}
              <div className="md:col-span-2 bg-[var(--color-surface)] p-5 rounded-xl border border-[var(--color-line)] shadow-xl">
                <h2 className="text-sm font-semibold mb-3 text-[var(--color-brass)] uppercase tracking-wider">Trading Activity & Metrics</h2>
                <StatsDashboard userWalletAddress={currentConnectedAddress} />
              </div>

              {/* INTERNAL WALLET SEND FEATURE */}
              <div className="bg-[var(--color-surface)] p-5 rounded-xl border border-[var(--color-line)] shadow-xl">
                <TransferTokenWidget />
              </div>
            </div>
          )}

          {/* DYNAMIC SCREEN PANEL VIEW */}
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-line)] min-h-[400px] shadow-xl">
            <Routes>
              <Route path="/" element={<Marketplace />} />
              <Route path="/buy" element={<BuyTCH8 />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/sales" element={<MySales />} />
              <Route path="/exchange" element={<Exchange />} />
              <Route path="/complaints" element={<Complaints />} />
              
              {/* SECURE ROUTE SWITCH PATH */}
              <Route path="/operator" element={<OperatorPanel />} />
            </Routes>
          </div>

          {/* COMPREHENSIVE HISTORICAL TRANSACTION TABLE PANEL */}
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-line)] shadow-xl">
            <h2 className="text-md font-bold mb-4 border-b pb-2" style={{ borderColor: 'var(--color-line)' }}>
              Personal Ledger & Transaction Records
            </h2>
            <MarketplaceHistory userWalletAddress={currentConnectedAddress} />
          </div>
        </main>
      </div>
    </div>
  );
}

// Inline component helper for layout box squares
function GridNavButton({ to, title, desc, icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 text-left group ${
        isActive
          ? 'bg-[var(--color-brass)] text-[var(--color-ink)] border-[var(--color-brass)] shadow-lg'
          : 'bg-[var(--color-surface)] border-[var(--color-line)] hover:border-[var(--color-brass)]'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <div>
        <h3 className="font-semibold text-sm leading-tight">{title}</h3>
        <p className={`text-xs mt-0.5 ${isActive ? 'text-[var(--color-ink)]/70' : 'text-[var(--color-muted)]'}`}>
          {desc}
        </p>
      </div>
    </Link>
  );
}

export default function App() {
  return (
    <WalletGate>
      <AppContent />
    </WalletGate>
  );
}
