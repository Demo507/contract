import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';

// The exact ERC-20 standard ABI specification for token transfers
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
  }
];

// Replace this address string with your live deployed TCH8 smart contract address
const TCH8_TOKEN_ADDRESS = '0x40e1cD143C5576610AF78bf5cF1da0C47Bbeb977'; 

// Replace this with your project's Target Chain ID (e.g., 1 for Ethereum Mainnet, 11155111 for Sepolia, 56 for BSC, etc.)
const TARGET_CHAIN_ID = 11155111; 

export default function TransferTokenWidget() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  
  // 1. Get user connection status and current network chainId
  const { chainId, isConnected } = useAccount();

  // 2. Setup standard Wagmi mutation pipeline components
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const isWrongNetwork = isConnected && chainId !== TARGET_CHAIN_ID;

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!recipient || !amount || isWrongNetwork) return;

    // Trigger explicit on-chain writing contract parameters
    writeContract({
      address: TCH8_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipient, parseEther(amount)],
    });
  };

  return (
    <form onSubmit={handleTransfer} className="flex flex-col gap-3 h-full justify-between">
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-brass)] uppercase tracking-wider mb-2">Send TCH8</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Recipient Address (0x...)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isPending || isConfirming || isWrongNetwork}
            className="w-full text-xs p-2 rounded bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] disabled:opacity-50"
          />
          <input
            type="number"
            step="any"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPending || isConfirming || isWrongNetwork}
            className="w-full text-xs p-2 rounded bg-[var(--color-ink)] border border-[var(--color-line)] text-white focus:outline-none focus:border-[var(--color-brass)] disabled:opacity-50"
          />
        </div>
      </div>

      <div className="mt-3">
        {isWrongNetwork ? (
          <div className="text-center p-2 rounded bg-red-950/40 border border-red-800/50 text-red-200 text-[11px]">
            ⚠️ Wrong Network. Please switch your wallet to the correct network.
          </div>
        ) : (
          <button
            type="submit"
            disabled={isPending || isConfirming || !recipient || !amount}
            className="w-full bg-[var(--color-brass)] text-[var(--color-ink)] font-bold py-2 px-4 text-xs rounded transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? 'Signing Transaction...' : isConfirming ? 'Confirming...' : 'Transfer TCH8'}
          </button>
        )}

        {isSuccess && (
          <div className="mt-2 text-center">
            <p className="text-green-400 text-[11px] font-medium">✓ Transfer successful!</p>
            {hash && (
              <a 
                href={`https://etherscan.io{hash}`} // Update URL matching your explorer structure
                target="_blank" 
                rel="noreferrer"
                className="text-blue-400 underline text-[10px] block mt-0.5 hover:text-blue-300"
              >
                View on Block Explorer
              </a>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-[10px] mt-1 text-center truncate" title={error.message}>
            Error: {error.shortMessage || "Transaction rejected."}
          </p>
        )}
      </div>
    </form>
  );
}
