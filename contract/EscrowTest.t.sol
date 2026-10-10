// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Escrow, Status, RedemptionStatus} from "../src/Escrow.sol"; // Adjust path to your contract
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// A mock ERC20 token that implements the ITCH8Burn custom burn behavior
contract MockTCH8 is ERC20 {
    constructor() ERC20("TCH8 Token", "TCH8") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}

contract EscrowTest is Test {
    Escrow public escrow;
    MockTCH8 public token;

    // Define actors
    address public gov = address(0x1);
    address public pendingGov = address(0x2);
    address public operator = address(0x3);
    address public buyer = address(0x4);
    address public seller = address(0x5);

    uint256 public constant INITIAL_BALANCE = 1000 ether;

    function setUp() public {
        // Deploy Mock Token
        token = new MockTCH8();

        // Deploy Escrow Contract
        escrow = new Escrow(address(token), gov, operator);

        // Seed buyers and sellers with tokens
        token.mint(buyer, INITIAL_BALANCE);
        token.mint(seller, INITIAL_BALANCE);

        // Pre-approve escrow contract to transfer funds on actors' behalf
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);

        vm.prank(seller);
        token.approve(address(escrow), type(uint256).max);
    }

    // ==========================================
    // ESCROW ORDER TESTS
    // ==========================================

    function test_CreateOrder_Success() public {
        uint256 amount = 100 ether;

        vm.prank(buyer);
        uint256 orderId = escrow.createOrder(buyer, seller, amount);

        assertEq(orderId, 0);
        assertEq(token.balanceOf(address(escrow)), amount);
        assertEq(token.balanceOf(buyer), INITIAL_BALANCE - amount);

        (address b, address s, uint256 amt, uint256 deliveredAt, Status status) = escrow.orders(orderId);
        assertEq(b, buyer);
        assertEq(s, seller);
        assertEq(amt, amount);
        assertEq(deliveredAt, 0);
        assertTrue(status == Status.Paid);
    }

    function test_CompleteOrderFlow_BuyerConfirms() public {
        uint256 amount = 100 ether;

        // 1. Create order
        vm.prank(buyer);
        uint256 orderId = escrow.createOrder(buyer, seller, amount);

        // 2. Seller marks as delivered
        vm.prank(seller);
        escrow.markDelivered(orderId);

        (, , , uint256 deliveredAt, Status status) = escrow.orders(orderId);
        assertEq(deliveredAt, block.timestamp);
        assertTrue(status == Status.Delivered);

        // 3. Buyer confirms delivery
        vm.prank(buyer);
        escrow.confirmDelivery(orderId);

        // 4. Verify financial state mutations
        (, , uint256 finalAmt, , Status finalStatus) = escrow.orders(orderId);
        assertEq(finalAmt, 0); 
        assertTrue(finalStatus == Status.Released);
        assertEq(token.balanceOf(seller), INITIAL_BALANCE + amount);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function test_ClaimAfterWindow_FailsEarly_SucceedsAfterTime() public {
        uint256 amount = 100 ether;

        vm.prank(buyer);
        uint256 orderId = escrow.createOrder(buyer, seller, amount);

        vm.prank(seller);
        escrow.markDelivered(orderId);

        // Fast-forward 5 days (less than the default 7 days autoReleaseWindow)
        skip(5 days);
        
        vm.prank(seller);
        vm.expectRevert(Escrow.WrongStatusError.selector);
        escrow.claimAfterWindow(orderId);

        // Fast-forward past the remaining window (2 more days + 1 second)
        skip(2 days + 1);

        vm.prank(seller);
        escrow.claimAfterWindow(orderId);

        assertEq(token.balanceOf(seller), INITIAL_BALANCE + amount);
    }

    function test_RefundBeforeDelivery_Success() public {
        uint256 amount = 50 ether;

        vm.prank(buyer);
        uint256 orderId = escrow.createOrder(buyer, seller, amount);

        vm.prank(buyer);
        escrow.refundBeforeDelivery(orderId);

        assertEq(token.balanceOf(buyer), INITIAL_BALANCE);
        (, , , , Status status) = escrow.orders(orderId);
        assertTrue(status == Status.Refunded);
    }

    function test_DisputeAndGovResolution_ToSeller() public {
        uint256 amount = 100 ether;

        vm.prank(buyer);
        uint256 orderId = escrow.createOrder(buyer, seller, amount);

        // Either buyer or seller can dispute
        vm.prank(buyer);
        escrow.raiseDispute(orderId);

        // Try to settle without governance rights (should fail)
        vm.prank(operator);
        vm.expectRevert(Escrow.OnlyGovernanceError.selector);
        escrow.resolveDispute(orderId, true);

        // Resolve via Gov to Seller
        vm.prank(gov);
        escrow.resolveDispute(orderId, true);

        assertEq(token.balanceOf(seller), INITIAL_BALANCE + amount);
    }

    // ==========================================
    // REDEMPTION TESTS
    // ==========================================

    function test_RequestAndConfirmRedemption_BurnsToken() public {
        uint256 burnAmount = 200 ether;
        uint256 totalSupplyBefore = token.totalSupply();

        // 1. Request Redemption
        vm.prank(seller);
        uint256 redemptionId = escrow.requestRedemption(burnAmount);

        assertEq(token.balanceOf(seller), INITIAL_BALANCE - burnAmount);
        assertEq(token.balanceOf(address(escrow)), burnAmount);

        // 2. Operator processes and fires external Burn
        vm.prank(operator);
        escrow.confirmRedemption(redemptionId);

        // 3. Asset assertions
        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(token.totalSupply(), totalSupplyBefore - burnAmount);

        (address rSeller, uint256 rAmt, RedemptionStatus rStatus) = escrow.redemptions(redemptionId);
        assertEq(rSeller, seller);
        assertEq(rAmt, burnAmount);
        assertTrue(rStatus == RedemptionStatus.Completed);
    }

    function test_RejectRedemption_ReturnsTokensToSeller() public {
        uint256 amount = 150 ether;

        vm.prank(seller);
        uint256 redemptionId = escrow.requestRedemption(amount);

        // Operator rejects
        vm.prank(operator);
        escrow.rejectRedemption(redemptionId);

        // Tokens are returned cleanly to the seller
        assertEq(token.balanceOf(seller), INITIAL_BALANCE);
        
        (, , RedemptionStatus rStatus) = escrow.redemptions(redemptionId);
        assertTrue(rStatus == RedemptionStatus.Rejected);
    }

    // ==========================================
    // SYSTEM GOVERNANCE TESTS
    // ==========================================

    function test_TwoStepGovernanceHandshake() public {
        vm.prank(gov);
        escrow.setGovernance(pendingGov);
        assertEq(escrow.pendingGovernance(), pendingGov);

        // Malicious or accidental actor trying to accept
        vm.prank(buyer);
        vm.expectRevert(Escrow.OnlyPendingGovernanceError.selector);
        escrow.acceptGovernance();

        // Valid execution by designated pending governance address
        vm.prank(pendingGov);
        escrow.acceptGovernance();

        assertEq(escrow.governance(), pendingGov);
        assertEq(escrow.pendingGovernance(), address(0));
    }
}
