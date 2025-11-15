// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TokenTransferor} from "../src/TokenTransferor.sol";
import {Script} from "forge-std/Script.sol";

contract TokenTransferorDeployer is Script {
    function run() external {
        // vm.startBroadcast();

        TokenTransferor tokenTransferor = new TokenTransferor(
            0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D, // Ethereum Router
            0x514910771AF9Ca656af840dff83E8264EcF986CA // LINK Token
        );

        uint64 dstChainSelector = 2183018362218727504;
        address receiver = 0xE3c1ca5c45818e57B298f3a080c8502BF7154352;
        address token = 0xdAC17F958D2ee523a2206206994597C13D831ec7; // USDT
        uint256 amount = 1;

        tokenTransferor.allowlistDestinationChain(dstChainSelector, true);

        // tokenTransferor.transferTokensPayNative(
        //     dstChainSelector,
        //     receiver,
        //     token,
        //     amount
        // );

        // vm.stopBroadcast();
    }
}