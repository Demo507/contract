// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TCH8} from "../src/TCH8.sol"; // Adjust path to match your contract location

contract TCH8Script is Script {
    // 1. PLACE YOUR ALREADY DEPLOYED CONTRACT ADDRESS HERE
    address constant DEPLOYED_ADDRESS = 0x1234567890123456789012345678901234567890; 

    function run() external {
        // Retrieve private key from your local .env file
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Point to your live contract on-chain
        TCH8 token = TCH8(DEPLOYED_ADDRESS);

        console.log("Connecting to contract at:", address(token));
        console.log("Token Name:", token.name());
        console.log("Token Symbol:", token.symbol());
        console.log("Current Total Supply:", token.totalSupply());

        // Example interaction: Broadcasting an on-chain transaction
        vm.startBroadcast(deployerPrivateKey);
        
        // Example: Unpausing the contract if it is paused
        // token.unpause();
        
        vm.stopBroadcast();
    }
}
