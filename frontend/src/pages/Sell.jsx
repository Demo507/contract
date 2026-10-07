import React, { useState } from 'react';
import { useAccount } from 'wagmi';

export default function Sell() {
  const { address: walletAddress } = useAccount();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!walletAddress) return alert("Please sign in first!");

    try {
      setStatus("⏳ Listing item in global directory...");
      const res = await fetch("https://onrender.com", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, price_tch8: Number(price), seller_address: walletAddress })
      });

      if (res.ok) {
        setStatus("✅ Product successfully listed in the Marketplace!");
        setTitle(""); setPrice("");
      } else { setStatus("❌ Listing failed."); }
    } catch (err) { setStatus("❌ Connection error."); }
  };

  return (
    <div className="text-white max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-medium">List a Product for Sale</h2>
      {status && <div className="p-2 bg-zinc-800 rounded text-sm">{status}</div>}
      <form onSubmit={handleCreateProduct} className="space-y-4 bg-zinc-900 p-6 border border-zinc-800 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Product Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-black border border-zinc-700 p-2 rounded text-white" placeholder="e.g. Premium Account Access" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price (TCH8 Tokens)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="w-full bg-black border border-zinc-700 p-2 rounded text-white" placeholder="e.g. 150" />
        </div>
        <button type="submit" className="w-full py-2 bg-[var(--color-brass)] text-black font-semibold rounded hover:opacity-90">List Product</button>
      </form>
    </div>
  );
}
