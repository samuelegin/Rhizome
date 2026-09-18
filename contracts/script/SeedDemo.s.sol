// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {RhizomeFactory} from "../src/rhizome/RhizomeFactory.sol";
import {Rhizome} from "../src/rhizome/Rhizome.sol";

/// @notice Creates one demo Rhizome ("Monad Builders", 30-day freshness,
/// 2 minimum connections) with two bootstrap anchors
contract SeedDemo is Script {
    bytes32 constant SHARED_GOVERNANCE = keccak256("SHARED_GOVERNANCE");
    uint64 constant FRESHNESS_PERIOD = 30 days;
    uint16 constant MINIMUM_CONNECTIONS = 2;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("RHIZOME_FACTORY");
        address anchor1 = vm.envAddress("ANCHOR_1");
        address anchor2 = vm.envAddress("ANCHOR_2");

        vm.startBroadcast(deployerPrivateKey);

        RhizomeFactory factory = RhizomeFactory(factoryAddress);
        address rhizomeAddress =
            factory.createRhizome("Monad Builders", SHARED_GOVERNANCE, FRESHNESS_PERIOD, MINIMUM_CONNECTIONS);

        Rhizome rhizome = Rhizome(rhizomeAddress);
        rhizome.addBootstrapMember(anchor1);
        rhizome.addBootstrapMember(anchor2);

        vm.stopBroadcast();

        console.log("Monad Builders Rhizome:", rhizomeAddress);
        console.log("Anchors:", anchor1, anchor2);
    }
}