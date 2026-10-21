import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import ConnectWallet from './components/ConnectWallet.jsx';
import TokenBalance from './components/TokenBalance.jsx';
import SupplyStats from './components/SupplyStats.jsx';
import RegisteredUsers from './components/RegisteredUsers.jsx';
import WalletGate from './components/WalletGate.jsx';
import Marketplace from './pages/Marketplace.jsx';
import MyOrders from './pages/MyOrders.jsx';
import MySales from './pages/MySales.jsx';
import Sell from './pages/Sell.jsx';
import BuyTCH8 from './pages/BuyTCH8.jsx';
import Exchange from './pages/Exchange.jsx';
import Complaints from './pages/Complaints.jsx';
import Admin from './pages/Admin.jsx';
import Diagnostics from './pages/Diagnostics.jsx';
import { OPERATOR_ADDRESS } from './contracts/addresses.js';

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className="text-sm px-3 py-2 rounded transition"
      style={{
        color: active ? 'var(--color-text)' : 'var(--color-muted)',
        borderBottom: active ? '2px solid var(--color-brass)' : '2px solid transparent',
      }}
    >
      {children}
    </Link>
  );
}

function AppContent() {
  const { address } = useAccount();
  const isOperator = Boolean(OPERATOR_ADDRESS) && address?.toLowerCase() === OPERATOR_ADDRESS;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-ink)' }}>
      <header style={{ borderBottom: '1px solid var(--color-line)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Link to="/" className="font-display text-xl tracking-tight">TCH8</Link>
            <nav className="flex flex-wrap">
              <NavLink to="/">Browse</NavLink>
              <NavLink to="/buy">Buy TCH8</NavLink>
              <NavLink to="/sell">Sell</NavLink>
              <NavLink to="/orders">My Orders</NavLink>
              <NavLink to="/sales">My Sales</NavLink>
              <NavLink to="/exchange">Exchange</NavLink>
              <NavLink to="/complaints">Complaints</NavLink>
              {isOperator && <NavLink to="/admin">Admin</NavLink>}
            </nav>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <RegisteredUsers />
            <SupplyStats />
            <TokenBalance />
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/buy" element={<BuyTCH8 />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/sales" element={<MySales />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
        </Routes>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-10 text-xs muted">
        TCH8 Marketplace · Sepolia testnet · <Link to="/diagnostics" className="underline">System check</Link>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WalletGate>
      <AppContent />
    </WalletGate>
  );
}
