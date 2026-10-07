import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther, parseUnits } from 'viem';

const BACKEND_URL = "https://onrender.com";
const TOKEN_SALE_ADDRESS = "0x72F8C939BBB4022Fd8cB233b5Fb69513198fE55e"; 
const ESCROW_CONTRACT_ADDRESS = "0xCC46849276578531cD274ffc2b95b019bafc1463";

const SALE_ABI = [{ name: 'buyTokens', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] }];
const ESCROW_ABI = [{ name: 'createOrder', type: 'function', stateMutability: 'external', inputs: [{ name: 'seller', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'uint256' }] }];

export default function Marketplace() {
  const { address: walletAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [products, setProducts] = useState([]);
  const [ethAmount, setEthAmount] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(e => console.error(e));
  }, []);

  // Buy TCH8 using Sepolia ETH
  const handleBuyTokens = async () => {
    try {
      setLoadingMsg("⏳ Processing on-chain token purchase...");
      await writeContractAsync({
        address: TOKEN_SALE_ADDRESS,
        abi: SALE_ABI,
        functionName: 'buyTokens',
        value: parseEther(ethAmount),
      });
      setLoadingMsg("✅ TCH8 tokens successfully purchased!");
      setEthAmount("");
    } catch (err) { setLoadingMsg(`❌ Swap Failed: ${err.message}`); }
  };

  // Buy a listed product (Triggers Escrow contract + logs to Supabase)
  const handleBuyProduct = async (product) => {
    try {
      setLoadingMsg(`⏳ Opening Escrow for: ${product.title}...`);
      const parsedAmount = parseUnits(product.price_tch8.toString(), 6); // 6 decimals

      // 1. Fire on-chain transaction
      await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'createOrder',
        args: [product.seller_address, parsedAmount],
      });

      // 2. Log tracking entry to Supabase via Render API
      const mockBlockchainId = Date.now(); // In production, extract the actual orderId from transaction logs

      await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockchainOrderId: mockBlockchainId,
          productId: product.id,
          buyerAddress: walletAddress,
          sellerAddress: product.seller_address,
          amountTch8: product.price_tch8
        })
      });

      setLoadingMsg("✅ Success! Order logged. Check 'My Orders' tab.");
    } catch (err) { setLoadingMsg(`❌ Purchase Failed: ${err.message}`); }
  };

  return (
    <div className="space-y-8 text-[var(--color-text)]">
      {loadingMsg && <div className="p-3 bg-zinc-800 rounded border border-zinc-700 text-sm">{loadingMsg}</div>}

      {/* Crowdsale Swap Section */}
      <section className="p-6 bg-zinc-900 rounded border border-zinc-800 max-w-md">
        <h3 className="font-semibold mb-2">Buy TCH8 with Sepolia ETH</h3>
        <div className="flex gap-3">
          <input type="number" placeholder="ETH Amount" value={ethAmount} onChange={e => setEthAmount(e.target.value)} className="bg-black text-white p-2 rounded w-full border border-zinc-700" />
          <button onClick={handleBuyTokens} className="px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700">Purchase</button>
        </div>
      </section>

      {/* Product Listings Grid */}
      <div>
        <h2 className="text-xl font-medium mb-4">Available Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-4">
              <h4 className="font-medium text-lg">{p.title}</h4>
              <p className="text-[var(--color-muted)]">Price: <strong className="text-white">{p.price_tch8} TCH8</strong></p>
              <button onClick={() => handleBuyProduct(p)} className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700">Buy via Escrow</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
