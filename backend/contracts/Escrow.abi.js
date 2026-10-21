// ethers v6 human-readable ABI. Matches smart-contracts/src/Escrow.sol
export const escrowAbi = [
  'function createOrder(address seller, uint256 amount) returns (uint256 orderId)',
  'function orders(uint256) view returns (address buyer, address seller, uint256 amount, uint256 deliveredAt, uint8 status)',
  'function redemptions(uint256) view returns (address seller, uint256 amount, uint8 status)',
  'function operator() view returns (address)',
  'function confirmRedemption(uint256 redemptionId)',
  'function rejectRedemption(uint256 redemptionId)',
  'event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount)',
  'event Delivered(uint256 indexed orderId)',
  'event Released(uint256 indexed orderId, address indexed to, uint256 amount)',
  'event Refunded(uint256 indexed orderId, address indexed to, uint256 amount)',
  'event Disputed(uint256 indexed orderId)',
  'event RedemptionRequested(uint256 indexed redemptionId, address indexed seller, uint256 amount)',
  'event RedemptionCompleted(uint256 indexed redemptionId, address indexed seller, uint256 amount)',
  'event RedemptionRejected(uint256 indexed redemptionId, address indexed seller, uint256 amount)',
];
