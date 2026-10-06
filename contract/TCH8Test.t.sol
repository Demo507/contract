// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {TCH8} from "../src/TCH8.sol";

contract TCH8Test is Test {
    TCH8 public token;

    // Test accounts
    address public owner = address(1);
    address public minter = address(2);
    address public user = address(3);
    address public pendingGov = address(4);

    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**6; // 1M tokens with 6 decimals

    function setUp() public {
        // Deploy a fresh local copy for the test runner
        vm.prank(owner);
        token = new TCH8("TCH8 Token", "TCH8", owner, MAX_SUPPLY);
    }

    function test_MetadataAndDecimals() public view {
        assertEq(token.name(), "TCH8 Token");
        assertEq(token.symbol(), "TCH8");
        assertEq(token.decimals(), 6);
        assertEq(token.maxSupply(), MAX_SUPPLY);
        assertEq(token.governance(), owner);
    }

    function test_AddAndRemoveMinter() public {
        vm.startPrank(owner);
        
        token.addMinter(minter);
        assertTrue(token.isMinter(minter));

        token.removeMinter(minter);
        assertFalse(token.isMinter(minter));
        
        vm.stopPrank();
    }

    function test_Fail_NonGovernanceCannotAddMinter() public {
        vm.prank(user);
        vm.expectRevert(TCH8.OnlyGovernanceError.selector);
        token.addMinter(minter);
    }

    function test_MintingAndLimits() public {
        // Setup minter
        vm.prank(owner);
        token.addMinter(minter);

        // Execute mint
        vm.prank(minter);
        token.mint(user, 500 * 10**6);

        assertEq(token.balanceOf(user), 500 * 10**6);
        assertEq(token.totalSupply(), 500 * 10**6);
    }

    function test_Fail_MintExceedsMaxSupply() public {
        vm.prank(owner);
        token.addMinter(minter);

        vm.prank(minter);
        vm.expectRevert(TCH8.MaxSupplyExceededError.selector);
        token.mint(user, MAX_SUPPLY + 1);
    }

    function test_GovernanceHandover() public {
        vm.prank(owner);
        token.setGovernance(pendingGov);
        assertEq(token.pendingGovernance(), pendingGov);

        vm.prank(pendingGov);
        token.acceptGovernance();
        
        assertEq(token.governance(), pendingGov);
        assertEq(token.pendingGovernance(), address(0));
    }

    function test_PauseBlocksTransfers() public {
        vm.prank(owner);
        token.addMinter(minter);

        vm.prank(minter);
        token.mint(owner, 100 * 10**6);

        // Pause the contract
        vm.prank(owner);
        token.pause();

        // Attempting to transfer while paused must revert
        vm.prank(owner);
        vm.expectRevert(); 
        token.transfer(user, 10 * 10**6);
    }
}
