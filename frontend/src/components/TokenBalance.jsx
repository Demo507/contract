import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TCH8_ADDRESS } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';

export default function TokenBalance() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useReadContract({
    address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'balanceOf',
    args: [address], query: { enabled: isConnected },
  });
  if (!isConnected) return null;
  return (
    <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
      <span className="font-display text-base" style={{ color: 'var(--color-brass)' }}>
        {balance !== undefined ? formatUnits(balance, 6) : '…'}
      </span>{' '}TCH8
    </div>
  );
}