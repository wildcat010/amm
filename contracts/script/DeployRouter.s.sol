
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Router} from "../src/Router.sol";

contract DeployRouter is Script {
    function run() external {
        string memory path = "deployments/sepolia.json";

        // Read the existing Pair address from the deployment file.
        string memory json = vm.readFile(path);
        address pairAddress = vm.parseJsonAddress(json, ".pair");

        require(pairAddress != address(0), "Invalid Pair address");

        // Deploy only the Router.
        vm.startBroadcast();
        Router router = new Router(pairAddress);
        vm.stopBroadcast();

        address routerAddress = address(router);

        // Save the Router address in the deployment file.
        vm.writeJson(
            vm.serializeAddress("deployment", "router", routerAddress),
            path,
            ".router"
        );

        console2.log("AMMPair:", pairAddress);
        console2.log("Router deployed:", routerAddress);
    }
}

