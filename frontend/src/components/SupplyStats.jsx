import { useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { TCH8_ADDRESS, ESCROW_ADDRESS, SALE_ADDRESS } from '../contracts/addresses.js';
import { tch8Abi } from '../contracts/tch8Abi.js';
import { saleAbi } from '../contracts/saleAbi.js';

export default function SupplyStats() {
  const { data: totalSupply } = useReadContract({
    address: TCH8_ADDRESS,
    abi: tch8Abi,
    functionName: 'totalSupply',
  });

  const { data: priceWeiPerToken } = useReadContract({
    address: SALE_ADDRESS,
    abi: saleAbi,
    functionName: 'priceWeiPerToken',
  });

  const { data: balances } = useReadContracts({
    contracts: [
      { address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'balanceOf', args: [ESCROW_ADDRESS] },
      { address: TCH8_ADDRESS, abi: tch8Abi, functionName: 'balanceOf', args: [SALE_ADDRESS] },
    ],
  });

  if (totalSupply === undefined) return null;

  const escrowLocked = balances?.[0]?.result ?? 0n;
  const saleLocked = balances?.[1]?.result ?? 0n;
  const circulating = totalSupply - escrowLocked - saleLocked;

  return (
    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textAlign: 'right', lineHeight: 1.3 }}>
      <div>Total supply: {formatUnits(totalSupply, 6)} TCH8</div>
      <div>In circulation: {formatUnits(circulating, 6)} TCH8</div>
      {priceWeiPerToken && (
        <div style={{ color: 'var(--color-brass)' }}>
          Price: {formatUnits(priceWeiPerToken, 18)} ETH / TCH8
        </div>
      )}
    </div>
  );
}
