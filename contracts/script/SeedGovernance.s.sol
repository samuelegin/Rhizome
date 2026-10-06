// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {RioGovernance} from "../src/rio/RioGovernance.sol";
import {MemberSpace} from "../src/rhizome/MemberSpace.sol";

contract SeedGovernance is Script {
    function run() external {
        address governanceAddress = vm.envAddress("RIO_GOVERNANCE");
        address rhizomeAddress = vm.envAddress("RHIZOME_ADDRESS");

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        uint256 anchor1Key = vm.envUint("ANCHOR_1_PRIVATE_KEY");
        uint256 anchor2Key = vm.envUint("ANCHOR_2_PRIVATE_KEY");
        uint256 memberKey = vm.envUint("MEMBER_PRIVATE_KEY");

        RioGovernance governance = RioGovernance(governanceAddress);

        vm.startBroadcast(deployerKey);
        MemberSpace memberSpace = new MemberSpace(rhizomeAddress);
        vm.stopBroadcast();

        uint64 startTime = uint64(block.timestamp);
        uint64 endTime = uint64(block.timestamp + 1 days);

        vm.startBroadcast(anchor1Key);
        uint256 proposalId = governance.createProposal(
            "Adopt Rhizome as the default membership primitive",
            "Seed proposal for demo evidence",
            startTime,
            endTime
        );
        governance.vote(proposalId, 1);
        vm.stopBroadcast();

        vm.startBroadcast(anchor2Key);
        governance.vote(proposalId, 1);
        vm.stopBroadcast();

        vm.startBroadcast(memberKey);
        governance.vote(proposalId, 1);
        vm.stopBroadcast();

        console.log("MemberSpace:", address(memberSpace));
        console.log("Proposal ID:", proposalId);
    }
}
