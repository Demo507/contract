import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useWriteContract, useDisconnect } from 'wagmi';
import { parseUnits, parseEther } from 'viem';

const BACKEND_URL = "https://onrender.com";
const TOKEN_SALE_ADDRESS = "0x72F8C939BBB4022Fd8cB233b5Fb69513198fE55e"; // ⚠️ Update with Sepolia Sales Contract Address
const ESCROW_CONTRACT_ADDRESS = "0xCC46849276578531cD274ffc2b95b019bafc1463"; // ⚠️ Update with Sepolia Escrow Contract Address

// Standard ABIs
const SALE_ABI = [{ name: 'buyTokens', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] }];
const ESCROW_ABI = [
  { name: 'createOrder', type: 'function', stateMutability: 'external', inputs: [{ name: 'seller', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'markDelivered', type: 'function', stateMutability: 'external', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] },
  { name: 'confirmDelivery', type: 'function', stateMutability: 'external', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] }
];

export default function App() {
  const { login, authenticated, user } = usePrivy();
  const { address: walletAddress } = useAccount(); // Wagmi native wallet hook
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();

  const isOperator = walletAddress?.toLowerCase() === "0xYourOperatorWalletAddressHere".toLowerCase(); // ⚠️ Update with actual operator address

  // App Layout States
  const [ethAmount, setEthAmount] = useState("");
  const [activeTab, setActiveTab] = useState("marketplace");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  // Sync profile details to Supabase upon successful Privy registration
  useEffect(() => {
    if (authenticated && walletAddress) {
      fetch(`${BACKEND_URL}/api/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          email: user.email?.address || null,
          phone: user.phone?.number || null
        })
      }).catch(err => console.error("Database tracking error:", err));

      fetchMarketplaceData();
    }
  }, [authenticated, walletAddress]);

  const fetchMarketplaceData = async () => {
    try {
      const prodRes = await fetch(`${BACKEND_URL}/api/products`);
      setProducts(await prodRes.json());
      
      const orderRes = await fetch(`${BACKEND_URL}/api/orders`);
      setOrders(await orderRes.json());
      
      if (isOperator && walletAddress) {
        const compRes = await fetch(`${BACKEND_URL}/api/operator/complaints`, {
          headers: { 'x-operator-wallet': walletAddress }
        });
        setComplaints(await compRes.json());
      }
    } catch (e) { console.error("Data syncing error:", e); }
  };

  // 🪙 1. TOKEN SALE: BUY TCH8 WITH ETH (Via Wagmi / Viem)
  const buyTokensWithETH = async () => {
    try {
      setStatusMessage("⏳ Processing your on-chain token purchase...");
      await writeContractAsync({
        address: TOKEN_SALE_ADDRESS,
        abi: SALE_ABI,
        functionName: 'buyTokens',
        value: parseEther(ethAmount),
      });
      setStatusMessage("✅ Success! Check your wallet for your new TCH8 tokens.");
      fetchMarketplaceData();
    } catch (err) { setStatusMessage(`❌ Swap Failed: ${err.message}`); }
  };

  // 🛒 2. MARKETPLACE PURCHASE: LOG ORDER IN ESCROW & SUPABASE
  const buyProduct = async (product) => {
    try {
      setStatusMessage(`⏳ Opening escrow transaction for ${product.title}...`);
      
      // Parse 6 decimals natively using Viem utilities
      const parsedAmount = parseUnits(product.price_tch8.toString(), 6);

      await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'createOrder',
        args: [product.seller_address, parsedAmount],
      });

      // Fetch tracking index log from smart contract to bind tracking data
      const mockBlockchainId = 0; 

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

      setStatusMessage("✅ Escrow successfully established! Visible under 'My Orders'.");
      fetchMarketplaceData();
    } catch (err) { setStatusMessage(`❌ Checkout Failed: ${err.message}`); }
  };

  // 📦 3. SELLER ACTION: MARK AS DELIVERED
  const handleMarkDelivered = async (orderId) => {
    try {
      setStatusMessage("⏳ Recording delivery state to block scanner...");
      await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'markDelivered',
        args: [BigInt(orderId)],
      });

      await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Delivered' })
      });

      setStatusMessage("✅ Flagged as Delivered! Buyer side notification updated.");
      fetchMarketplaceData();
    } catch (err) { setStatusMessage(`❌ Action failed: ${err.message}`); }
  };

  // 💰 4. BUYER ACTION: CONFIRM DELIVERY (RELEASES FUNDS)
  const handleConfirmDelivery = async (orderId) => {
    try {
      setStatusMessage("⏳ Authorizing release of escrow funds to vendor...");
      await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'confirmDelivery',
        args: [BigInt(orderId)],
      });

      await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Released' })
      });

      setStatusMessage("✅ Funds successfully unlocked to vendor wallet balance!");
      fetchMarketplaceData();
    } catch (err) { setStatusMessage(`❌ Authorization failed: ${err.message}`); }
  };

  // 📣 5. USER COMPLAINT PIPELINE
  const fileComplaint = async (orderId) => {
    const desc = prompt("Describe your dispute reason explicitly for the operator review:");
    if (!desc) return;
    
    await fetch(`${BACKEND_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reporterAddress: walletAddress, description: desc })
    });
    alert("Complaint logged privately with the System Operator registry.");
    fetchMarketplaceData();
  };

  if (!authenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
        <h1>TCH8 Escrow DApp Marketplace</h1>
        <p>Onboard instantly using Email, Phone, or traditional Web3 Wallets.</p>
        <button onClick={login} style={{ padding: '12px 24px', fontSize: '16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Connect Profile & Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <div>
          <h2>TCH8 Scaled DApp Panel</h2>
          <span style={{ color: 'gray' }}>Active Account Identity: <strong>{walletAddress || "Connecting Web3 wallet..."}</strong></span>
        </div>
        <button onClick={disconnect} style={{ height: '35px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Disconnect</button>
      </header>

      {statusMessage && <div style={{ background: '#f0f2f5', padding: '12px', margin: '15px 0', borderRadius: '4px' }}>{statusMessage}</div>}

      {/* SWAP WIDGET */}
      <section style={{ border: '1px solid #d9d9d9', padding: '15px', borderRadius: '8px', margin: '20px 0', maxWidth: '400px' }}>
        <h4>Acquire Ecosystem TCH8 with Sepolia ETH</h4>
        <input type="number" placeholder="ETH amount" value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} style={{ padding: '8px', marginRight: '10px' }} />
        <button onClick={buyTokensWithETH} style={{ background: '#52c41a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Purchase TCH8</button>
      </section>

      {/* DASHBOARD ROUTE BUTTONS */}
      <nav style={{ margin: '20px 0', display: 'flex', gap: '15px' }}>
        <button onClick={() => setActiveTab("marketplace")} style={{ fontWeight: activeTab === "marketplace" ? "bold" : "normal" }}>🏪 Buy Products</button>
        <button onClick={() => setActiveTab("myorders")} style={{ fontWeight: activeTab === "myorders" ? "bold" : "normal" }}>📦 My Orders (Buyer)</button>
        <button onClick={() => setActiveTab("mysales")} style={{ fontWeight: activeTab === "mysales" ? "bold" : "normal" }}>💰 My Sales (Seller)</button>
        {isOperator && <button onClick={() => setActiveTab("complaints")} style={{ color: 'red', fontWeight: activeTab === "complaints" ? "bold" : "normal" }}>🚨 Operator Desk ({complaints.length})</button>}
      </nav>

      {/* VIEW RENDER CONDITIONS */}
      {activeTab === "marketplace" && (
        <div>
          <h3>Live Marketplace Inventory</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {products.map(p => (
              <div key={p.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '6px', width: '200px' }}>
                <h5>{p.title}</h5>
