// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {MyTokenA} from "../src/MyTokenA.sol";
import {MyTokenB} from "../src/MyTokenB.sol";
import {AMMPair} from "../src/AMMPair.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        MyTokenA tokenA = new MyTokenA(msg.sender);
        MyTokenB tokenB = new MyTokenB(msg.sender);

        AMMPair pair = new AMMPair(
            address(tokenA),
            address(tokenB)
        );

        vm.stopBroadcast();

        console2.log("MyTokenA:", address(tokenA));
        console2.log("MyTokenB:", address(tokenB));
        console2.log("AMMPair:", address(pair));

        // Build JSON 
        string memory json = vm.serializeAddress( "deployment", "tokenA", address(tokenA) );
        json = vm.serializeAddress( "deployment", "tokenB", address(tokenB) ); 
        json = vm.serializeAddress( "deployment", "pair", address(pair) );

        // Write JSON file 
        vm.writeJson(json, "deployments/sepolia.json");
    }
}