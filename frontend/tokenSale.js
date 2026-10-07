import { ethers } from "https://cloudflare.com";

// ⚠️ UPDATE THESE CONSTRAINTS WITH YOUR LIVE DEPLOYED DATA
const TOKEN_SALE_ADDRESS = "0x72F8C939BBB4022Fd8cB233b5Fb69513198fE55e"; 

// The ABI should match your Sales contract's deposit/buy function
const TOKEN_SALE_ABI = [
    "function buyTokens() external payable", 
    // If your function has a different name (e.g. purchase(), deposit()), change it above!
];

/**
 * Buys TCH8 Tokens by sending Sepolia ETH directly to the Sales Contract
 * @param {string} ethAmountString - The amount of ETH to spend (e.g. "0.05")
 */
export async function buyTCH8WithETH(ethAmountString) {
    const statusText = document.getElementById('sale-status');
    
    if (!window.ethereum) {
        statusText.innerText = "❌ No Web3 wallet detected. Please install MetaMask or sign in.";
        statusText.style.color = "red";
        return;
    }

    try {
        statusText.innerText = "⏳ Connecting to network...";
        statusText.style.color = "orange";

        // 1. Connect to the browser's crypto provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // 2. Initialize the Sales Contract Instance
        const saleContract = new ethers.Contract(TOKEN_SALE_ADDRESS, TOKEN_SALE_ABI, signer);

        statusText.innerText = `⏳ Submitting transaction to spend ${ethAmountString} Sepolia ETH...`;

        // 3. Trigger the payable function, sending ETH along with the transaction
        const tx = await saleContract.buyTokens({
            value: ethers.parseEther(ethAmountString) // Automatically parses decimal ETH to Wei format
        });

        statusText.innerText = "⛏️ Transaction processing on Sepolia... Please wait.";
        
        // 4. Wait for block confirmation
        const receipt = await tx.wait();
        
        console.log("Purchase receipt:", receipt);
        statusText.innerText = "✅ Success! TCH8 tokens purchased and added to your wallet balance.";
        statusText.style.color = "green";

    } catch (error) {
        console.error("Token purchase error:", error);
        statusText.innerText = `❌ Error: ${error.reason || error.message || "Transaction failed"}`;
        statusText.style.color = "red";
    }
}
