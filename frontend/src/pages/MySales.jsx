import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';

const BACKEND_URL = "https://onrender.com";
const ESCROW_CONTRACT_ADDRESS = "0xCC46849276578531cD274ffc2b95b019bafc1463";
const ESCROW_ABI = [{ name: 'markDelivered', type: 'function', stateMutability: 'external', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] }];

export default function MySales() {
  const { address: walletAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [sales, setSales] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (walletAddress) {
      fetch(`${BACKEND_URL}/api/orders?seller=${walletAddress}`)
        .then(res => res.json())
        .then(data => setSales(data))
        .catch(e => console.error(e));
    }
  }, [walletAddress]);

  const shipItem = async (blockchainOrderId) => {
    try {
      setMsg("⏳ Submitting delivery status to blockchain...");
      await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'markDelivered',
        args: [BigInt(blockchainOrderId)]
      });

      await fetch(`${BACKEND_URL}/api/orders/${blockchainOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Delivered' })
      });

      setMsg("✅ Order flagged as Delivered! Awaiting buyer confirmation.");
    } catch (err) { setMsg(`❌ Error: ${err.message}`); }
  };

  return (
    <div className="text-white space-y-4">
      <h2 className="text-xl font-medium">My Sales (Incoming Vendor Panel)</h2>
      {msg && <div className="p-2 bg-zinc-800 rounded">{msg}</div>}
      <div className="space-y-3">
        {sales.map(s => (
          <div key={s.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded flex justify-between items-center">
            <div>
              <p className="font-medium">{s.products?.title || "Ecosystem Order"}</p>
              <p className="text-sm text-zinc-400">Earnings: {s.amount_tch8} TCH8 | Status: <span className="font-semibold text-blue-400">{s.status}</span></p>
            </div>
            <div>
              {s.status === 'Paid' && (
                <button onClick={() => shipItem(s.blockchain_order_id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">Mark Delivered</button>
              )}
              {s.status === 'Released' && (
                <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2.5 py-1 rounded font-medium">🎉 Funds Unlocked in Wallet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';

const BACKEND_URL = "https://onrender.com";
const ESCROW_CONTRACT_ADDRESS = "0xYourEscrowContractAddressHere";
const ESCROW_ABI = [{ name: 'markDelivered', type: 'function', stateMutability: 'external', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] }];

export default function MySales() {
  const { address: walletAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [sales, setSales] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (walletAddress) {
      fetch(`${BACKEND_URL}/api/orders?seller=${walletAddress}`)
        .then(res => res.json())
        .then(data => setSales(data))
        .catch(e => console.error(e));
    }
  }, [walletAddress]);

  const shipItem = async (blockchainOrderId) => {
    try {
      setMsg("⏳ Submitting delivery status to blockchain...");
      await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'markDelivered',
        args: [BigInt(blockchainOrderId)]
      });

      await fetch(`${BACKEND_URL}/api/orders/${blockchainOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Delivered' })
      });

      setMsg("✅ Order flagged as Delivered! Awaiting buyer confirmation.");
    } catch (err) { setMsg(`❌ Error: ${err.message}`); }
  };

  return (
    <div className="text-white space-y-4">
      <h2 className="text-xl font-medium">My Sales (Incoming Vendor Panel)</h2>
      {msg && <div className="p-2 bg-zinc-800 rounded">{msg}</div>}
      <div className="space-y-3">
        {sales.map(s => (
          <div key={s.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded flex justify-between items-center">
            <div>
              <p className="font-medium">{s.products?.title || "Ecosystem Order"}</p>
              <p className="text-sm text-zinc-400">Earnings: {s.amount_tch8} TCH8 | Status: <span className="font-semibold text-blue-400">{s.status}</span></p>
            </div>
            <div>
              {s.status === 'Paid' && (
                <button onClick={() => shipItem(s.blockchain_order_id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">Mark Delivered</button>
              )}
              {s.status === 'Released' && (
                <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2.5 py-1 rounded font-medium">🎉 Funds Unlocked in Wallet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
