export const escrowAbi = [
  { type: 'function', name: 'createOrder', stateMutability: 'nonpayable', inputs: [{ name: 'seller', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: 'orderId', type: 'uint256' }] },
  { type: 'function', name: 'markDelivered', stateMutability: 'nonpayable', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'confirmDelivery', stateMutability: 'nonpayable', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'claimAfterWindow', stateMutability: 'nonpayable', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'refundBeforeDelivery', stateMutability: 'nonpayable', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'raiseDispute', stateMutability: 'nonpayable', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'requestRedemption', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [{ name: 'redemptionId', type: 'uint256' }] },
  { type: 'function', name: 'orders', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ name: 'buyer', type: 'address' }, { name: 'seller', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'deliveredAt', type: 'uint256' }, { name: 'status', type: 'uint8' }] },
];