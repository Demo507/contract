import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ConnectWallet from './components/ConnectWallet.jsx';
import TokenBalance from './components/TokenBalance.jsx';
import Marketplace from './pages/Marketplace.jsx';
import MyOrders from './pages/MyOrders.jsx';
import MySales from './pages/MySales.jsx';
import Sell from './pages/Sell.jsx';

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`text-sm px-3 py-2 rounded transition ${
        active ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
      }`}
      style={active ? { borderBottom: '2px solid var(--color-brass)' } : {}}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-ink)' }}>
      <header style={{ borderBottom: '1px solid var(--color-line)' }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-xl tracking-tight">
              TCH8
            </Link>
            <nav className="flex gap-1">
              <NavLink to="/">Browse</NavLink>
              <NavLink to="/sell">Sell</NavLink>
              <NavLink to="/orders">My Orders</NavLink>
              <NavLink to="/sales">My Sales</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <TokenBalance />
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/sales" element={<MySales />} />
        </Routes>
      </main>
    </div>
  );
}