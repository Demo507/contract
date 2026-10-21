import { parseAbi } from 'viem';

export const saleAbi = parseAbi([
  'function buy() payable',
  'function priceWeiPerToken() view returns (uint256)',
]);
