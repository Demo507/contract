import React, { useMemo } from 'react';

// Example structured transaction item: 
// { id: 1, type: 'BUY_TCH8' | 'ITEM_BOUGHT' | 'ITEM_SOLD', amount: 500, timestamp: 178939023 }
export default function StatsDashboard({ userWalletAddress, transactions = [] }) {
  
  const stats = useMemo(() => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    let dailyVol = 0, monthlyVol = 0, yearlyVol = 0;
    let counts = { TCH8_bought: 0, items_bought: 0, items_sold: 0 };

    transactions.forEach(tx => {
      const txDate = new Date(tx.timestamp);
      const timeDiff = now - txDate;

      // Volume aggregations
      if (timeDiff <= oneDay) dailyVol += tx.amount;
      if (txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()) monthlyVol += tx.amount;
      if (txDate.getFullYear() === now.getFullYear()) yearlyVol += tx.amount;

      // Type breakdowns
      if (tx.type === 'BUY_TCH8') counts.TCH8_bought += tx.amount;
      if (tx.type === 'ITEM_BOUGHT') counts.items_bought += 1;
      if (tx.type === 'ITEM_SOLD') counts.items_sold += 1;
    });

    return { dailyVol, monthlyVol, yearlyVol, counts };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[var(--color-text)] bg-[var(--color-line)] p-4 rounded-lg">
      <div className="p-3 border-r border-gray-700">
        <h3 className="text-xs text-[var(--color-muted)] uppercase">Your Trading Volume</h3>
        <p className="text-lg font-bold">24h: {stats.dailyVol} TCH8</p>
        <p className="text-sm">30d: {stats.monthlyVol} TCH8</p>
        <p className="text-sm">365d: {stats.yearlyVol} TCH8</p>
      </div>
      <div className="p-3 col-span-2">
        <h3 className="text-xs text-[var(--color-muted)] uppercase">Activity Summary</h3>
        <div className="flex gap-6 mt-2">
          <div><span className="text-xs block text-[var(--color-muted)]">TCH8 Purchased</span> <span className="font-mono font-bold text-green-400">{stats.counts.TCH8_bought}</span></div>
          <div><span className="text-xs block text-[var(--color-muted)]">Items Bought</span> <span className="font-mono font-bold text-blue-400">{stats.counts.items_bought}</span></div>
          <div><span className="text-xs block text-[var(--color-muted)]">Items Sold</span> <span className="font-mono font-bold text-brass">{stats.counts.items_sold}</span></div>
        </div>
      </div>
    </div>
  );
}
