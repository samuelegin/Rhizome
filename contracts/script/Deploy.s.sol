// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {RioToken} from "../src/rio/RioToken.sol";
import {RioStaking} from "../src/rio/RioStaking.sol";
import {RioGovernance} from "../src/rio/RioGovernance.sol";
import {RelationshipRegistry} from "../src/rhizome/RelationshipRegistry.sol";
import {RhizomeFactory} from "../src/rhizome/RhizomeFactory.sol";

/// @notice Deploys the full stack in dependency order:
///   RioToken -> RioStaking -> RioGovernance -> RelationshipRegistry -> RhizomeFactory
contract Deploy is Script {
    uint256 constant INITIAL_RIO_SUPPLY = 1_000_000 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        RioToken rioToken = new RioToken(INITIAL_RIO_SUPPLY, deployer);
        RioStaking rioStaking = new RioStaking(address(rioToken));
        RioGovernance rioGovernance = new RioGovernance();

        RelationshipRegistry registry = new RelationshipRegistry(deployer, deployer);

        RhizomeFactory factory = new RhizomeFactory(address(registry));

        vm.stopBroadcast();

        console.log("Deployer:", deployer);
        console.log("RioToken:", address(rioToken));
        console.log("RioStaking:", address(rioStaking));
        console.log("RioGovernance:", address(rioGovernance));
        console.log("RelationshipRegistry:", address(registry));
        console.log("RhizomeFactory:", address(factory));
        console.log("");
    }
}