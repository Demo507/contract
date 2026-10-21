import { parseAbi } from 'viem';

// Both createOrder shapes are listed on purpose:
//   (seller, amount)          -> secure version (buyer = msg.sender)  [smart-contracts/src/Escrow.sol]
//   (buyer, seller, amount)   -> earlier version some deployments used
// The app checks the deployed bytecode and calls whichever one exists (see lib/escrowMode.js).
export const escrowAbi = parseAbi([
  'function createOrder(address seller, uint256 amount) returns (uint256 orderId)',
  'function createOrder(address buyer, address seller, uint256 amount) returns (uint256 orderId)',
  'function markDelivered(uint256 orderId)',
  'function confirmDelivery(uint256 orderId)',
  'function claimAfterWindow(uint256 orderId)',
  'function refundBeforeDelivery(uint256 orderId)',
  'function raiseDispute(uint256 orderId)',
  'function requestRedemption(uint256 amount) returns (uint256 redemptionId)',
  'function token() view returns (address)',
  'function operator() view returns (address)',
  'function governance() view returns (address)',
  'function orders(uint256) view returns (address buyer, address seller, uint256 amount, uint256 deliveredAt, uint8 status)',
  'event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount)',
  'event RedemptionRequested(uint256 indexed redemptionId, address indexed seller, uint256 amount)',
]);
