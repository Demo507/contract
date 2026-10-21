import { useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { TCH8_ADDRESS, ESCROW_ADDRESS, SALE_ADDRESS } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';
import { saleAbi } from '../contracts/saleAbi.js';
import { fmtTch8 } from '../lib/format.js';

export default function SupplyStats() {
  const q = { refetchInterval: 15000 };
  const { data: total } = useReadContract({ address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'totalSupply', query: q });
  const { data: price } = useReadContract({ address: SALE_ADDRESS, abi: saleAbi, functionName: 'priceWeiPerToken', query: q });
  const { data: locked } = useReadContracts({
    contracts: [{ address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'balanceOf', args: [ESCROW_ADDRESS] }],
    query: q,
  });

  if (total === undefined) return null;
  const inEscrow = locked?.[0]?.result ?? 0n;
  const circulating = total - inEscrow;

  return (
    <div className="text-xs muted text-right leading-tight">
      <div>Total supply: {fmtTch8(total)} TCH8</div>
      <div>In circulation: {fmtTch8(circulating)} TCH8</div>
      {price !== undefined && (
        <div style={{ color: 'var(--color-brass)' }}>Price: {formatUnits(price, 18)} ETH / TCH8</div>
      )}
    </div>
  );
}
