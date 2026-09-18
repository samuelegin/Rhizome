// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {RioToken} from "../src/rio/RioToken.sol";
import {RioGovernance} from "../src/rio/RioGovernance.sol";
import {RioStaking} from "../src/rio/RioStaking.sol";
import {RelationshipRegistry} from "../src/rhizome/RelationshipRegistry.sol";
import {Rhizome} from "../src/rhizome/Rhizome.sol";
import {RhizomeFactory} from "../src/rhizome/RhizomeFactory.sol";
import {MemberSpace} from "../src/rhizome/MemberSpace.sol";

contract TestBase is Test {
    bytes32 constant SHARED_GOVERNANCE = keccak256("SHARED_GOVERNANCE");

    address owner = makeAddr("owner");
    address registrar = makeAddr("registrar");
    address creator = makeAddr("creator");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");
    address david = makeAddr("david");
    address eve = makeAddr("eve");

    RioToken rioToken;
    RioGovernance rioGovernance;
    RioStaking rioStaking;
    RelationshipRegistry registry;
    RhizomeFactory factory;

    function setUp() public virtual {
        vm.startPrank(owner);
        rioToken = new RioToken(1_000_000 ether, owner);
        vm.stopPrank();

        rioGovernance = new RioGovernance();
        rioStaking = new RioStaking(address(rioToken));

        vm.prank(owner);
        registry = new RelationshipRegistry(registrar, owner);

        factory = new RhizomeFactory(address(registry));
    }

    function _registerConnection(address a, address b, uint64 firstAt, uint64 lastAt) internal {
        vm.prank(registrar);
        registry.registerConnection(a, b, SHARED_GOVERNANCE, 1, firstAt, lastAt, keccak256("evidence"));
    }

    function _registerConnectionWithEvidence(address a, address b, uint32 evidenceCount, uint64 firstAt, uint64 lastAt)
        internal
    {
        vm.prank(registrar);
        registry.registerConnection(a, b, SHARED_GOVERNANCE, evidenceCount, firstAt, lastAt, keccak256("evidence"));
    }

    function _deployRhizome(string memory name, uint64 freshnessPeriod, uint16 minimumConnections)
        internal
        returns (Rhizome)
    {
        vm.prank(creator);
        address rhz = factory.createRhizome(name, SHARED_GOVERNANCE, freshnessPeriod, minimumConnections);
        return Rhizome(rhz);
    }
}
