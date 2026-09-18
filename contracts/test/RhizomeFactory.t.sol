// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {TestBase} from "./TestBase.sol";
import {Rhizome} from "../src/rhizome/Rhizome.sol";
import {RhizomeFactory} from "../src/rhizome/RhizomeFactory.sol";

contract RhizomeFactoryTest is TestBase {
    function test_Constructor_RevertZeroRegistry() public {
        vm.expectRevert(RhizomeFactory.ZeroAddress.selector);
        new RhizomeFactory(address(0));
    }

    function test_CreateRhizome_DeploysAndTracks() public {
        Rhizome rhz = _deployRhizome("Monad Builders", 30 days, 2);
        assertTrue(address(rhz) != address(0));

        address[] memory all = factory.getAllRhizomes();
        assertEq(all.length, 1);
        assertEq(all[0], address(rhz));
        assertEq(factory.allRhizomesLength(), 1);
    }

    function test_CreateRhizome_ConfigForwardedCorrectly() public {
        Rhizome rhz = _deployRhizome("Monad Builders", 45 days, 3);

        (
            address registryAddress,
            string memory name,
            bytes32 signalType,
            uint64 freshnessPeriod,
            uint16 minimumConnections,
        ) = rhz.getConfig();

        assertEq(registryAddress, address(registry));
        assertEq(name, "Monad Builders");
        assertEq(signalType, SHARED_GOVERNANCE);
        assertEq(freshnessPeriod, 45 days);
        assertEq(minimumConnections, 3);
    }

    function test_CreateRhizome_CreatorAssignedFromCaller() public {
        Rhizome rhz = _deployRhizome("Monad Builders", 30 days, 2);
        assertEq(rhz.creator(), creator);
    }

    function test_CreateRhizome_StoresConfigInFactory() public {
        vm.prank(creator);
        address rhz = factory.createRhizome("Monad Builders", SHARED_GOVERNANCE, 30 days, 2);

        (string memory name, bytes32 signalType, uint64 freshnessPeriod, uint16 minimumConnections, address creator_) =
            factory.rhizomeConfigs(rhz);

        assertEq(name, "Monad Builders");
        assertEq(signalType, SHARED_GOVERNANCE);
        assertEq(freshnessPeriod, 30 days);
        assertEq(minimumConnections, 2);
        assertEq(creator_, creator);
    }

    function test_CreateRhizome_EmitsEvent() public {
        vm.prank(creator);
        vm.recordLogs();
        address rhz = factory.createRhizome("Monad Builders", SHARED_GOVERNANCE, 30 days, 2);

        // Sanity: the deployed address is a contract with expected creator
        assertEq(Rhizome(rhz).creator(), creator);
    }

    function test_CreateRhizome_EmitsCompleteEvent() public {
        vm.expectEmit(false, true, false, true);
        emit RhizomeFactory.RhizomeCreated(address(0), creator, "Monad Builders", SHARED_GOVERNANCE, 30 days, 2);

        vm.prank(creator);
        factory.createRhizome("Monad Builders", SHARED_GOVERNANCE, 30 days, 2);
    }

    function test_CreateRhizome_MultipleIndependentInstances() public {
        Rhizome rhzA = _deployRhizome("A", 30 days, 2);
        Rhizome rhzB = _deployRhizome("B", 15 days, 1);

        assertTrue(address(rhzA) != address(rhzB));
        assertEq(factory.allRhizomesLength(), 2);
    }

    function test_CreateRhizome_RevertsOnInvalidConfig() public {
        vm.prank(creator);
        vm.expectRevert(Rhizome.InvalidConfig.selector);
        factory.createRhizome("Bad", SHARED_GOVERNANCE, 30 days, 0);
    }
}
