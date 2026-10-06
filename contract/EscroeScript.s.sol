// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Escrow} from "../src/Escrow.sol";

contract Escrow is Script {
    function run() external {
        // 1. Fetch the deployment private key from your local .env file
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // 2. Fetch your ALREADY deployed TCH8 token address from your .env file
        address tch8TokenAddress = vm.envAddress("TCH8_TOKEN_ADDRESS");
        
        // 3. Define who the Governance and Operator should be
        // (For simplicity, we can use the deployer's address derived from the private key)
        address governanceWallet = vm.addr(deployerPrivateKey);
        address operatorWallet = vm.addr(deployerPrivateKey);

        console.log("Starting Escrow Deployment Setup...");
        console.log("Using TCH8 Token Address:", tch8TokenAddress);
        console.log("Setting Initial Governance:", governanceWallet);
        console.log("Setting Initial Operator:", operatorWallet);
        console.log("--------------------------------------------------");

        // 4. Start broadcasting real transactions to the blockchain network
        vm.startBroadcast(deployerPrivateKey);

        // 5. Deploy the Escrow contract live by passing parameters into the constructor
        Escrow escrow = new Escrow(
            tch8TokenAddress,
            governanceWallet,
            operatorWallet
        );

        vm.stopBroadcast();

        // 6. Print out the freshly generated address so you can copy it to your backend env!
        console.log("--------------------------------------------------");
        console.log("✅ Escrow Contract Deployed Successfully!");
        console.log("🚀 Live Escrow Address:", address(escrow));
        console.log("--------------------------------------------------");
    }
}
