// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITCH8Burn {
    function burn(uint256 amount) external;
}

contract Escrow is ReentrancyGuard {
    error ZeroAddressError();
    error InvalidAmountError();
    error NotBuyerError();
    error NotSellerError();
    error WrongStatusError();
    error TransferFailedError();
    error OnlyGovernanceError();
    error OnlyPendingGovernanceError();
    error OnlyOperatorError();

    enum Status { None, Paid, Delivered, Released, Refunded, Disputed }

    struct Order {
        address buyer;
        address seller;
        uint256 amount;
        uint256 deliveredAt;
        Status status;
    }

    enum RedemptionStatus { None, Pending, Completed, Rejected }

    struct Redemption {
        address seller;
        uint256 amount;
        RedemptionStatus status;
    }

    IERC20 public immutable token;
    uint256 public autoReleaseWindow = 7 days;
    uint256 public nextOrderId;
    mapping(uint256 => Order) public orders;

    uint256 public nextRedemptionId;
    mapping(uint256 => Redemption) public redemptions;

    address public governance;
    address public pendingGovernance;
    address public operator;

    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event Delivered(uint256 indexed orderId);
    event Released(uint256 indexed orderId, address indexed to, uint256 amount);
    event Refunded(uint256 indexed orderId, address indexed to, uint256 amount);
    event Disputed(uint256 indexed orderId);
    event DisputeResolved(uint256 indexed orderId, bool releasedToSeller);
    event GovernanceTransferStarted(address indexed previousGovernance, address indexed pendingGovernance);
    event GovernanceTransferAccepted(address indexed previousGovernance, address indexed newGovernance);
    event OperatorUpdated(address indexed previousOperator, address indexed newOperator);
    event RedemptionRequested(uint256 indexed redemptionId, address indexed seller, uint256 amount);
    event RedemptionCompleted(uint256 indexed redemptionId, address indexed seller, uint256 amount);
    event RedemptionRejected(uint256 indexed redemptionId, address indexed seller, uint256 amount);

    modifier onlyBuyer(uint256 orderId) {
        if (msg.sender != orders[orderId].buyer) revert NotBuyerError();
        _;
    }

    modifier onlySeller(uint256 orderId) {
        if (msg.sender != orders[orderId].seller) revert NotSellerError();
        _;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert OnlyGovernanceError();
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) revert OnlyOperatorError();
        _;
    }

    constructor(address _token, address _governance, address _operator) {
        if (_token == address(0) || _governance == address(0) || _operator == address(0)) {
            revert ZeroAddressError();
        }
        token = IERC20(_token);
        governance = _governance;
        operator = _operator;
    }

    /// @notice Creates an escrow order pulling funds from the buyer to be released to the seller.
    function createOrder(address buyer, address seller, uint256 amount) external nonReentrant returns (uint256 orderId) {
        if (buyer == address(0) || seller == address(0)) revert ZeroAddressError();
        if (amount == 0) revert InvalidAmountError();

        orderId = nextOrderId++;
        orders[orderId] = Order({
            buyer: buyer,
            seller: seller,
            amount: amount,
            deliveredAt: 0,
            status: Status.Paid
        });

        emit OrderCreated(orderId, buyer, seller, amount);

        // Pulls tokens safely from the buyer's wallet (Requires buyer to approve this Escrow contract first)
        bool ok = token.transferFrom(buyer, address(this), amount);
        if (!ok) revert TransferFailedError();
    }

    function markDelivered(uint256 orderId) external onlySeller(orderId) {
        Order storage o = orders[orderId];
        if (o.status != Status.Paid) revert WrongStatusError();

        o.status = Status.Delivered;
        o.deliveredAt = block.timestamp;

        emit Delivered(orderId);
    }

    function confirmDelivery(uint256 orderId) external onlyBuyer(orderId) nonReentrant {
        Order storage o = orders[orderId];
        if (o.status != Status.Delivered) revert WrongStatusError();

        _release(orderId, o);
    }

    function claimAfterWindow(uint256 orderId) external onlySeller(orderId) nonReentrant {
        Order storage o = orders[orderId];
        if (o.status != Status.Delivered) revert WrongStatusError();
        if (block.timestamp < o.deliveredAt + autoReleaseWindow) revert WrongStatusError();

        _release(orderId, o);
    }

    function refundBeforeDelivery(uint256 orderId) external onlyBuyer(orderId) nonReentrant {
        Order storage o = orders[orderId];
        if (o.status != Status.Paid) revert WrongStatusError();

        _refund(orderId, o);
    }

    function raiseDispute(uint256 orderId) external {
        Order storage o = orders[orderId];
        if (msg.sender != o.buyer && msg.sender != o.seller) revert NotBuyerError();
        if (o.status != Status.Paid && o.status != Status.Delivered) revert WrongStatusError();

        o.status = Status.Disputed;
        emit Disputed(orderId);
    }

    function requestRedemption(uint256 amount) external nonReentrant returns (uint256 redemptionId) {
        if (amount == 0) revert InvalidAmountError();

        redemptionId = nextRedemptionId++;
        redemptions[redemptionId] = Redemption({
            seller: msg.sender,
            amount: amount,
            status: RedemptionStatus.Pending
        });

        emit RedemptionRequested(redemptionId, msg.sender, amount);

        bool ok = token.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailedError();
    }

    function confirmRedemption(uint256 redemptionId) external onlyOperator nonReentrant {
        Redemption storage r = redemptions[redemptionId];
        if (r.status != RedemptionStatus.Pending) revert WrongStatusError();

        uint256 amount = r.amount;
        address seller = r.seller;

        r.status = RedemptionStatus.Completed;
        ITCH8Burn(address(token)).burn(amount);

        emit RedemptionCompleted(redemptionId, seller, amount);
    }

    function rejectRedemption(uint256 redemptionId) external onlyOperator nonReentrant {
        Redemption storage r = redemptions[redemptionId];
        if (r.status != RedemptionStatus.Pending) revert WrongStatusError();

        uint256 amount = r.amount;
        address seller = r.seller;

        r.status = RedemptionStatus.Rejected;
        bool ok = token.transfer(seller, amount);
        if (!ok) revert TransferFailedError();

        emit RedemptionRejected(redemptionId, seller, amount);
    }

    function resolveDispute(uint256 orderId, bool releaseToSeller) external onlyGovernance nonReentrant {
        Order storage o = orders[orderId];
        if (o.status != Status.Disputed) revert WrongStatusError();

        emit DisputeResolved(orderId, releaseToSeller);

        if (releaseToSeller) {
            _release(orderId, o);
        } else {
            _refund(orderId, o);
        }
    }

    function setAutoReleaseWindow(uint256 newWindow) external onlyGovernance {
        autoReleaseWindow = newWindow;
    }

    function setGovernance(address newGovernance) external onlyGovernance {
        if (newGovernance == address(0)) revert ZeroAddressError();
        pendingGovernance = newGovernance;
        emit GovernanceTransferStarted(governance, newGovernance);
    }

    function acceptGovernance() external {
        if (msg.sender != pendingGovernance) revert OnlyPendingGovernanceError();
        emit GovernanceTransferAccepted(governance, pendingGovernance);
        governance = pendingGovernance;
        pendingGovernance = address(0);
    }

    function setOperator(address newOperator) external onlyGovernance {
        if (newOperator == address(0)) revert ZeroAddressError();
        emit OperatorUpdated(operator, newOperator);
        operator = newOperator;
    }

    function _release(uint256 orderId, Order storage o) internal {
        uint256 amount = o.amount;
        address seller = o.seller;
        o.status = Status.Released;
        o.amount = 0;

        bool ok = token.transfer(seller, amount);
        if (!ok) revert TransferFailedError();

        emit Released(orderId, seller, amount);
    }

    function _refund(uint256 orderId, Order storage o) internal {
        uint256 amount = o.amount;
        address buyer = o.buyer;
        o.status = Status.Refunded;
        o.amount = 0;

        bool ok = token.transfer(buyer, amount);
        if (!ok) revert TransferFailedError();

        emit Refunded(orderId, buyer, amount);
    }
}
