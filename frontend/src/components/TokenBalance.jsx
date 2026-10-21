import { useAccount, useReadContract } from 'wagmi';
import { TCH8_ADDRESS } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';
import { fmtTch8 } from '../lib/format.js';

export default function TokenBalance() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useReadContract({
    address: TCH8_ADDRESS,
    abi: tch8Abi,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: isConnected && Boolean(address), refetchInterval: 15000 },
  });
  if (!isConnected) return null;
  return (
    <div className="text-sm muted">
      <span className="font-display text-base" style={{ color: 'var(--color-brass)' }}>
        {balance !== undefined ? fmtTch8(balance) : '…'}
      </span>{' '}
      TCH8
    </div>
  );
}
