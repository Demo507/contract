import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';

const BACKEND_URL = "https://onrender.com";
const ESCROW_CONTRACT_ADDRESS = "0xCC46849276578531cD274ffc2b95b019bafc1463";
const ESCROW_ABI = [{ name: 'confirmDelivery', type: 'function', stateMutability: 'external', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] }];

export default function MyOrders() {
  const { address: walletAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (walletAddress) {
      fetch(`${BACKEND_URL}/api/orders?buyer=${walletAddress}`)
        .then(res => res.json())
        .then(data => setOrders(data))
        .catch(e => console.error(e));
    }
  }, [walletAddress]);

  const confirmReceipt = async (blockchainOrderId) => {
    try {
      setMsg("⏳ Releasing escrow funds to seller...");
      await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'confirmDelivery',
        args: [BigInt(blockchainOrderId)]
      });

      await fetch(`${BACKEND_URL}/api/orders/${blockchainOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Released' })
      });

      setMsg("✅ Delivery confirmed! Funds unlocked to seller.");
    } catch (err) { setMsg(`❌ Error: ${err.message}`); }
  };

  const submitComplaint = async (orderId) => {
    const reason = prompt("Enter complaint for the Operator:");
    if (!reason) return;
    await fetch(`${BACKEND_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reporterAddress: walletAddress, description: reason })
    });
    alert("Complaint filed privately with the Operator.");
  };

  return (
    <div className="text-white space-y-4">
      <h2 className="text-xl font-medium">My Orders (Purchases)</h2>
      {msg && <div className="p-2 bg-zinc-800 rounded">{msg}</div>}
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded flex justify-between items-center">
            <div>
              <p className="font-medium">{o.products?.title || "Market Product"}</p>
              <p className="text-sm text-zinc-400">Price: {o.amount_tch8} TCH8 | Status: <span className="text-brass font-bold">{o.status}</span></p>
            </div>
            <div className="flex gap-2">
              {o.status === 'Delivered' && (
                <button onClick={() => confirmReceipt(o.blockchain_order_id)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded">Confirm Delivery</button>
              )}
              <button onClick={() => submitComplaint(o.id)} className="px-3 py-1.5 bg-zinc-800 text-red-400 text-xs rounded hover:bg-zinc-700">Dispute</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
