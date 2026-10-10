// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Escrow} from "../src/Escrow.sol"; // Adjust path to your contract

contract DeployEscrow is Script {
    function run() external returns (Escrow escrow) {
        // 1. Fetch deployment configuration parameters from environment variables
        // This ensures secrets and network-specific variables are never hardcoded.
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        address governanceAddress = vm.envAddress("GOVERNANCE_ADDRESS");
        address operatorAddress = vm.envAddress("OPERATOR_ADDRESS");

        // 2. Output diagnostic info to terminal
        console2.log("Preparing deployment from account:", vm.addr(deployerPrivateKey));
        console2.log("Target ERC20 Token Address:", tokenAddress);
        console2.log("Designated Governance Address:", governanceAddress);
        console2.log("Designated Operator Address:", operatorAddress);

        // 3. Initiate the on-chain broadcast sequence
        vm.startBroadcast(deployerPrivateKey);

        escrow = new Escrow(tokenAddress, governanceAddress, operatorAddress);

        vm.stopBroadcast();

        // 4. Log the output deployment result
        console2.log("Escrow contract successfully deployed at:", address(escrow));
    }
}
