// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {Escrow} from "../src/Escrow.sol";
import {TCH8} from "../src/TCH8.sol";

contract EscrowTest is Test {
    TCH8 public token;
    Escrow public escrow;

    // System roles / Addresses
    address public gov = address(1);
    address public operator = address(2);
    address public buyer = address(3);
    address public seller = address(4);

    uint256 public constant MAX_SUPPLY = 21_000_000 * 10**6; // 6 decimals
    uint256 public constant TEST_AMOUNT = 1_000 * 10**6;    // 1,000 tokens

    function setUp() public {
        // 1. Deploy TCH8 token with 6 decimals
        vm.prank(gov);
        token = new TCH8("TCH8 Token", "TCH8", gov, MAX_SUPPLY);

        // 2. Deploy Escrow platform
        escrow = new Escrow(address(token), gov, operator);

        // 3. Make Escrow contract a Minter on TCH8 so it has permission to call burn()
        vm.prank(gov);
        token.addMinter(address(escrow));

        // 4. Also make the test contract a minter to seed funds to the buyer and seller
        vm.prank(gov);
        token.addMinter(address(this));
        token.mint(buyer, 50_000 * 10**6);
        token.mint(seller, 50_000 * 10**6);

        // 5. Pre-approve Escrow contract to move funds for the actors
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);

        vm.prank(seller);
        token.approve(address(escrow), type(uint256).max);
    }

    function test_CreateAndCompleteOrder() public {
        // Buyer creates an escrow order
        vm.prank(buyer);
        uint256 orderId = escrow.createOrder(seller, TEST_AMOUNT);
        
        assertEq(orderId, 0);
        assertEq(token.balanceOf(address(escrow)), TEST_AMOUNT);

        // Seller marks order as delivered
        vm.prank(seller);
        escrow.markDelivered(orderId);

        // Buyer confirms delivery to release the funds
        uint256 sellerBalanceBefore = token.balanceOf(seller);
        vm.prank(buyer);
        escrow.confirmDelivery(orderId);

        assertEq(token.balanceOf(seller), sellerBalanceBefore + TEST_AMOUNT);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function test_ClaimAfterAutoReleaseWindow() public {
        vm.prank(buyer);
        uint256 orderId = escrow.createOrder(seller, TEST_AMOUNT);

        vm.prank(seller);
        escrow.markDelivered(orderId);

        // Warp forward 8 days (violating the 7-day auto-release window)
        vm.warp(block.timestamp + 8 days);

        uint256 sellerBalanceBefore = token.balanceOf(seller);
        vm.prank(seller);
        escrow.claimAfterWindow(orderId);

        assertEq(token.balanceOf(seller), sellerBalanceBefore + TEST_AMOUNT);
    }

    function test_DisputeAndGovernanceResolution() public {
        vm.prank(buyer);
        uint256 orderId = escrow.createOrder(seller, TEST_AMOUNT);

        // Buyer locks the order in a dispute status
        vm.prank(buyer);
        escrow.raiseDispute(orderId);

        // Governance steps in and decides to return funds to Buyer
        uint256 buyerBalanceBefore = token.balanceOf(buyer);
        vm.prank(gov);
        escrow.resolveDispute(orderId, false); // false = refund buyer

        assertEq(token.balanceOf(buyer), buyerBalanceBefore + TEST_AMOUNT);
    }

    function test_RedemptionAndTokenBurn() public {
        uint256 totalSupplyBefore = token.totalSupply();

        // Seller requests platform redemption (sends tokens to Escrow contract)
        vm.prank(seller);
        uint256 redemptionId = escrow.requestRedemption(TEST_AMOUNT);

        // Operator confirms the redemption, which triggers ITCH8Burn(token).burn()
        vm.prank(operator);
        escrow.confirmRedemption(redemptionId);

        // Assert that the tokens were permanently destroyed from the ecosystem
        assertEq(token.totalSupply(), totalSupplyBefore - TEST_AMOUNT);
        assertEq(token.balanceOf(address(escrow)), 0);
    }
}
