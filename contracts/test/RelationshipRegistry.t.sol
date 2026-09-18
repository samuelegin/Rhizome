// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {TestBase} from "./TestBase.sol";
import {RelationshipRegistry} from "../src/rhizome/RelationshipRegistry.sol";

contract RelationshipRegistryTest is TestBase {
    function test_RegisterConnection_Basic() public {
        _registerConnection(alice, bob, 100, 200);

        RelationshipRegistry.Connection memory c = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        assertTrue(c.exists);
        assertEq(c.firstQualifiedAt, 100);
        assertEq(c.lastQualifiedAt, 200);
        assertEq(c.evidenceRef, keccak256("evidence"));
    }

    function test_RegisterConnection_RevertUnauthorizedRegistrar() public {
        vm.prank(alice);
        vm.expectRevert(RelationshipRegistry.NotRegistrar.selector);
        registry.registerConnection(alice, bob, SHARED_GOVERNANCE, 1, 100, 200, keccak256("evidence"));
    }

    function test_SetRegistrar_OwnerCanChange() public {
        address newRegistrar = makeAddr("newRegistrar");
        vm.prank(owner);
        registry.setRegistrar(newRegistrar);
        assertEq(registry.registrar(), newRegistrar);

        // old registrar can no longer register
        vm.prank(registrar);
        vm.expectRevert(RelationshipRegistry.NotRegistrar.selector);
        registry.registerConnection(alice, bob, SHARED_GOVERNANCE, 1, 100, 200, keccak256("evidence"));

        // new registrar can
        vm.prank(newRegistrar);
        registry.registerConnection(alice, bob, SHARED_GOVERNANCE, 1, 100, 200, keccak256("evidence"));
    }

    function test_SetRegistrar_RevertNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        registry.setRegistrar(makeAddr("newRegistrar"));
    }

    function test_SetRegistrar_RevertZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(RelationshipRegistry.ZeroAddress.selector);
        registry.setRegistrar(address(0));
    }

    function test_Constructor_RevertZeroRegistrar() public {
        vm.expectRevert(RelationshipRegistry.ZeroAddress.selector);
        new RelationshipRegistry(address(0), owner);
    }

    function test_AddressNormalization_SameConnectionRegardlessOfOrder() public view {
        bytes32 idForward = registry.connectionId(alice, bob, SHARED_GOVERNANCE);
        bytes32 idReverse = registry.connectionId(bob, alice, SHARED_GOVERNANCE);
        assertEq(idForward, idReverse);
    }

    function test_ReversedAddressOrder_ResolvesToSameConnection() public {
        _registerConnection(alice, bob, 100, 200);

        RelationshipRegistry.Connection memory viaAliceBob = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        RelationshipRegistry.Connection memory viaBobAlice = registry.getConnection(bob, alice, SHARED_GOVERNANCE);

        assertEq(viaAliceBob.firstQualifiedAt, viaBobAlice.firstQualifiedAt);
        assertEq(viaAliceBob.lastQualifiedAt, viaBobAlice.lastQualifiedAt);
        assertEq(viaAliceBob.evidenceRef, viaBobAlice.evidenceRef);

        // registering from the reversed order updates the SAME connection, not a new one
        vm.prank(registrar);
        registry.registerConnection(bob, alice, SHARED_GOVERNANCE, 2, 100, 300, keccak256("evidence2"));

        RelationshipRegistry.Connection memory updated = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        assertEq(updated.lastQualifiedAt, 300);
        assertEq(updated.evidenceRef, keccak256("evidence2"));
        assertEq(updated.evidenceCount, 2);
    }

    function test_Renewal_PreservesFirstQualifiedAt_UpdatesLastAndEvidence() public {
        _registerConnection(alice, bob, 100, 200);
        _registerConnection(alice, bob, 150, 400); // renewal with a later "first" should NOT move it forward

        RelationshipRegistry.Connection memory c = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        assertEq(c.firstQualifiedAt, 100, "firstQualifiedAt must not move forward on renewal");
        assertEq(c.lastQualifiedAt, 400, "lastQualifiedAt should update on renewal");
    }

    function test_Renewal_EvidenceRefUpdates() public {
        _registerConnection(alice, bob, 100, 200);

        vm.prank(registrar);
        registry.registerConnection(alice, bob, SHARED_GOVERNANCE, 1, 100, 250, keccak256("new-evidence"));

        RelationshipRegistry.Connection memory c = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        assertEq(c.evidenceRef, keccak256("new-evidence"));
    }

    function test_EvidenceCount_SetOnCreation() public {
        _registerConnectionWithEvidence(alice, bob, 3, 100, 200);

        RelationshipRegistry.Connection memory c = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        assertEq(c.evidenceCount, 3);
    }

    function test_EvidenceCount_UpdatesOnRenewal() public {
        _registerConnectionWithEvidence(alice, bob, 2, 100, 200);
        _registerConnectionWithEvidence(alice, bob, 5, 100, 300);

        RelationshipRegistry.Connection memory c = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        assertEq(c.evidenceCount, 5, "evidenceCount should update on renewal");
    }

    function test_ConnectionRegistered_EmitsEvidenceCount() public {
        bytes32 expectedId = registry.connectionId(alice, bob, SHARED_GOVERNANCE);
        (address a, address b) = alice < bob ? (alice, bob) : (bob, alice);

        vm.expectEmit(true, true, true, true);
        emit RelationshipRegistry.ConnectionRegistered(
            expectedId, a, b, SHARED_GOVERNANCE, 4, 100, 200, keccak256("evidence")
        );

        vm.prank(registrar);
        registry.registerConnection(alice, bob, SHARED_GOVERNANCE, 4, 100, 200, keccak256("evidence"));
    }

    function test_DuplicateNeighborPrevention_OnRenewal() public {
        _registerConnection(alice, bob, 100, 200);
        _registerConnection(alice, bob, 100, 300); // renewal
        _registerConnection(alice, bob, 100, 400); // another renewal

        address[] memory aliceNeighbors = registry.getNeighbors(alice);
        assertEq(aliceNeighbors.length, 1, "neighbor list must not duplicate on renewal");
        assertEq(aliceNeighbors[0], bob);

        address[] memory bobNeighbors = registry.getNeighbors(bob);
        assertEq(bobNeighbors.length, 1);
        assertEq(bobNeighbors[0], alice);
    }

    function test_Neighbors_MultipleDistinctConnections() public {
        _registerConnection(alice, bob, 100, 200);
        _registerConnection(alice, charlie, 100, 200);

        address[] memory aliceNeighbors = registry.getNeighbors(alice);
        assertEq(aliceNeighbors.length, 2);
    }

    function test_SelfConnection_Reverts() public {
        vm.prank(registrar);
        vm.expectRevert(RelationshipRegistry.SelfConnection.selector);
        registry.registerConnection(alice, alice, SHARED_GOVERNANCE, 1, 100, 200, keccak256("evidence"));
    }

    function test_ZeroAddress_Reverts() public {
        vm.startPrank(registrar);
        vm.expectRevert(RelationshipRegistry.ZeroAddress.selector);
        registry.registerConnection(address(0), bob, SHARED_GOVERNANCE, 1, 100, 200, keccak256("evidence"));

        vm.expectRevert(RelationshipRegistry.ZeroAddress.selector);
        registry.registerConnection(alice, address(0), SHARED_GOVERNANCE, 1, 100, 200, keccak256("evidence"));
        vm.stopPrank();
    }

    function test_InvalidTimestamps_Reverts() public {
        vm.prank(registrar);
        vm.expectRevert(RelationshipRegistry.InvalidTimestamps.selector);
        registry.registerConnection(alice, bob, SHARED_GOVERNANCE, 1, 300, 200, keccak256("evidence"));
    }

    function test_IsConnectionActive_TrueWithinFreshnessWindow() public {
        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);

        assertTrue(registry.isConnectionActive(alice, bob, SHARED_GOVERNANCE, 30 days));
    }

    function test_IsConnectionActive_FalseAfterFreshnessExpires() public {
        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);

        vm.warp(1000 + 30 days + 1);
        assertFalse(registry.isConnectionActive(alice, bob, SHARED_GOVERNANCE, 30 days));
    }

    function test_IsConnectionActive_FalseForNonexistentConnection() public view {
        assertFalse(registry.isConnectionActive(alice, bob, SHARED_GOVERNANCE, 30 days));
    }

    function test_IsConnectionActive_OrderIndependent() public {
        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);

        assertEq(
            registry.isConnectionActive(alice, bob, SHARED_GOVERNANCE, 30 days),
            registry.isConnectionActive(bob, alice, SHARED_GOVERNANCE, 30 days)
        );
    }

    function test_GetConnection_ReturnsEmptyForNonexistent() public view {
        RelationshipRegistry.Connection memory c = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        assertFalse(c.exists);
    }

    function test_DistinctSignalTypesDoNotCollide() public {
        bytes32 otherSignal = keccak256("OTHER_SIGNAL");
        _registerConnection(alice, bob, 100, 200);

        vm.prank(registrar);
        registry.registerConnection(alice, bob, otherSignal, 1, 100, 500, keccak256("other-evidence"));

        RelationshipRegistry.Connection memory shared = registry.getConnection(alice, bob, SHARED_GOVERNANCE);
        RelationshipRegistry.Connection memory other = registry.getConnection(alice, bob, otherSignal);

        assertEq(shared.lastQualifiedAt, 200);
        assertEq(other.lastQualifiedAt, 500);

        // neighbor list still only has one entry for bob (adjacency is not per-signal)
        assertEq(registry.getNeighbors(alice).length, 1);
    }
}
