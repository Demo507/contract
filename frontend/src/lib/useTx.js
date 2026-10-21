import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

export function friendlyError(e) {
  const text = `${e?.shortMessage || ''} ${e?.message || ''} ${e?.name || ''}`;
  if (/User rejected|UserRejected|denied/i.test(text)) return 'You cancelled the request in your wallet.';
  if (/insufficient funds/i.test(text)) return 'Not enough Sepolia ETH in your wallet to pay the network fee.';
  if (/CannotBuyOwnListing/i.test(text)) return 'You cannot buy your own listing.';
  if (/WrongStatus/i.test(text)) return 'This order is not in the right stage for that action yet.';
  if (/NotBuyer/i.test(text)) return 'Only the buyer can do this.';
  if (/NotSeller/i.test(text)) return 'Only the seller can do this.';
  if (/transfer amount exceeds balance|ERC20InsufficientBalance/i.test(text)) return 'You do not have enough TCH8.';
  if (/ERC20InsufficientAllowance/i.test(text)) return 'Approval missing. Please try again.';
  return e?.shortMessage || e?.message || 'Something went wrong.';
}

// send(): simulate first (so real revert reasons are shown), then sign, then WAIT until mined.
export function useTx() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  async function send({ address: to, abi, functionName, args, value }) {
    await publicClient.simulateContract({ account: address, address: to, abi, functionName, args, value });
    const hash = await writeContractAsync({ address: to, abi, functionName, args, value });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('The transaction failed on the blockchain.');
    return { hash, receipt };
  }

  const refresh = () => queryClient.invalidateQueries();
  return { send, refresh, publicClient, address };
}
