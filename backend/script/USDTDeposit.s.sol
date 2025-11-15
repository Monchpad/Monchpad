// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {USDTDeposit} from "../src/USDTDeposit.sol";
import {Script} from "forge-std/Script.sol";

contract USDTDepositDeployer is Script {
    function run() external {
        vm.startBroadcast();

        IERC20 usdt = IERC20(0xdAC17F958D2ee523a2206206994597C13D831ec7);

        USDTDeposit usdtDeposit = new USDTDeposit(
            0xdAC17F958D2ee523a2206206994597C13D831ec7, // USDT Token Address
            100 * 10**6,
            block.timestamp, // Start Timestamp: Now
            block.timestamp + 30 days // End Timestamp: 30 days from now
        );

        vm.stopBroadcast();
    }
}