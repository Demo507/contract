import React, { useState, useEffect } from 'react';

export default function MarketplaceHistory({ userWalletAddress }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [personalHistory, setPersonalHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'personal'
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch Global Broadcasts
        const globalRes = await fetch(`${BACKEND_URL}/api/orders/broadcast`);
        const globalData = await globalRes.json();
        setBroadcasts(Array.isArray(globalData) ? globalData : []);

        // 2. Fetch Personal History if user wallet is connected
        if (userWalletAddress) {
          const personalRes = await fetch(`${BACKEND_URL}/api/orders/history/${userWalletAddress}`);
          const personalData = await personalRes.json();
          setPersonalHistory(Array.isArray(personalData) ? personalData : []);
        }
      } catch (error) {
        console.error("Error fetching ledger streams:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userWalletAddress, BACKEND_URL]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h2>📊 Marketplace Activity Ledger</h2>
      
      {/* Tab Switchers */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('global')}
          style={{ padding: '10px 20px', background: activeTab === 'global' ? '#3b82f6' : '#1e293b', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}
        >
          🎉 Global Sales Feed
        </button>
        <button 
          onClick={() => setActiveTab('personal')}
          style={{ padding: '10px 20px', background: activeTab === 'personal' ? '#3b82f6' : '#1e293b', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}
          disabled={!userWalletAddress}
        >
          👤 My Account History {!userWalletAddress && '(Connect Wallet)'}
        </button>
      </div>

      {loading ? (
        <p>Loading transaction ledgers...</p>
      ) : activeTab === 'global' ? (
        <div className="broadcast-section">
          <h3>Recent Global Marketplace Sales</h3>
          {broadcasts.length === 0 ? <p>No successful sales recorded yet.</p> : 
            broadcasts.map(order => (
              <div key={order.order_id} style={{ background: '#1e293b', padding: '15px', borderRadius: '6px', marginBottom: '10px', borderLeft: '4px solid #10b981' }}>
                <p style={{ margin: 0 }}>
                  🛍️ Item <strong>{order.product_title}</strong> bought by <code>{order.buyer_address.slice(0,6)}...{order.buyer_address.slice(-4)}</code> for <strong>{order.amount} TCH8</strong>
                </p>
                <small style={{ color: '#94a3b8' }}>Tx: <code>{order.tx_hash.slice(0,10)}...</code></small>
              </div>
            ))
          }
        </div>
      ) : (
        <div className="history-section">
          <h3>Your Buying & Selling Logs</h3>
          {personalHistory.length === 0 ? <p>You haven't participated in any transactions yet.</p> : 
            personalHistory.map(order => {
              const isBuyer = order.buyer_address.toLowerCase() === userWalletAddress.toLowerCase();
              return (
                <div key={order.order_id} style={{ background: '#1e293b', padding: '15px', borderRadius: '6px', marginBottom: '10px', borderLeft: isBuyer ? '4px solid #3b82f6' : '4px solid #eab308' }}>
                  <span style={{ fontSize: '12px', background: isBuyer ? '#2563eb' : '#d97706', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {isBuyer ? 'Bought' : 'Sold'}
                  </span>
                  <p style={{ margin: '5px 0 0 0' }}>
                    Item: <strong>{order.product_title}</strong> | Volume: <strong>{order.amount} TCH8</strong>
                  </p>
                  <small style={{ color: '#94a3b8' }}>Tx: <code>{order.tx_hash}</code></small>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

