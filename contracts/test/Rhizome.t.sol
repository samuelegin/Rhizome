// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {TestBase} from "./TestBase.sol";
import {Rhizome} from "../src/rhizome/Rhizome.sol";

contract RhizomeTest is TestBase {
    Rhizome rhizome;

    function setUp() public override {
        super.setUp();
        rhizome = _deployRhizome("Monad Builders", 30 days, 2);
    }

    function test_Configuration() public view {
        (
            address registryAddress,
            string memory name,
            bytes32 signalType,
            uint64 freshnessPeriod,
            uint16 minimumConnections,
            address creator_
        ) = rhizome.getConfig();

        assertEq(registryAddress, address(registry));
        assertEq(name, "Monad Builders");
        assertEq(signalType, SHARED_GOVERNANCE);
        assertEq(freshnessPeriod, 30 days);
        assertEq(minimumConnections, 2);
        assertEq(creator_, creator);
    }

    function test_Creator_IsFactoryCaller() public view {
        assertEq(rhizome.creator(), creator);
    }

    function test_Constructor_RevertZeroRegistry() public {
        vm.expectRevert(Rhizome.ZeroAddress.selector);
        new Rhizome(address(0), "X", SHARED_GOVERNANCE, 30 days, 2, creator);
    }

    function test_Constructor_RevertZeroCreator() public {
        vm.expectRevert(Rhizome.ZeroAddress.selector);
        new Rhizome(address(registry), "X", SHARED_GOVERNANCE, 30 days, 2, address(0));
    }

    function test_Constructor_RevertMinimumConnectionsZero() public {
        vm.expectRevert(Rhizome.InvalidConfig.selector);
        new Rhizome(address(registry), "X", SHARED_GOVERNANCE, 30 days, 0, creator);
    }

    function test_Constructor_RevertMinimumConnectionsAboveBootstrapCap() public {
        vm.expectRevert(Rhizome.InvalidConfig.selector);
        new Rhizome(address(registry), "X", SHARED_GOVERNANCE, 30 days, 4, creator);
    }

    function test_Constructor_RevertZeroFreshnessPeriod() public {
        vm.expectRevert(Rhizome.InvalidConfig.selector);
        new Rhizome(address(registry), "X", SHARED_GOVERNANCE, 0, 2, creator);
    }

    function test_AddBootstrapMember_Success() public {
        vm.prank(creator);
        rhizome.addBootstrapMember(bob);

        assertTrue(rhizome.isBootstrapMember(bob));
        assertTrue(rhizome.isMember(bob));

        address[] memory members = rhizome.getBootstrapMembers();
        assertEq(members.length, 1);
        assertEq(members[0], bob);
    }

    function test_AddBootstrapMember_RevertNotCreator() public {
        vm.prank(alice);
        vm.expectRevert(Rhizome.NotCreator.selector);
        rhizome.addBootstrapMember(bob);
    }

    function test_AddBootstrapMember_RevertZeroAddress() public {
        vm.prank(creator);
        vm.expectRevert(Rhizome.ZeroAddress.selector);
        rhizome.addBootstrapMember(address(0));
    }

    function test_AddBootstrapMember_RevertAlreadyBootstrap() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        vm.expectRevert(Rhizome.AlreadyBootstrapMember.selector);
        rhizome.addBootstrapMember(bob);
        vm.stopPrank();
    }

    function test_MaximumThreeBootstrapMembers() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        rhizome.addBootstrapMember(david);

        vm.expectRevert(Rhizome.BootstrapLimitReached.selector);
        rhizome.addBootstrapMember(eve);
        vm.stopPrank();

        assertEq(rhizome.getBootstrapMembers().length, 3);
    }

    function test_MembershipQualification_ViaTwoActiveAnchorConnections() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        vm.stopPrank();

        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);
        _registerConnection(alice, charlie, 900, 1000);

        assertTrue(rhizome.isMember(alice));
    }

    function test_MembershipQualification_InsufficientConnections() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        vm.stopPrank();

        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000); // only 1 active connection, need 2

        assertFalse(rhizome.isMember(alice));
    }

    function test_MembershipQualification_StaleConnectionDoesNotCount() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        rhizome.addBootstrapMember(david);
        vm.stopPrank();

        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);
        _registerConnection(alice, charlie, 900, 1000);
        _registerConnection(alice, david, 100, 200); // will go stale

        vm.warp(1000 + 30 days + 1);
        assertFalse(rhizome.isMember(alice));
    }

    function test_MembershipChanges_WhenConnectionsExpire() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        vm.stopPrank();

        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);
        _registerConnection(alice, charlie, 900, 1000);
        assertTrue(rhizome.isMember(alice), "should qualify while both connections are fresh");

        vm.warp(1000 + 30 days + 1);
        assertFalse(rhizome.isMember(alice), "should stop qualifying once connections go stale");

        _registerConnection(alice, bob, 900, uint64(block.timestamp));
        assertFalse(rhizome.isMember(alice), "one renewed connection is still insufficient");

        _registerConnection(alice, charlie, 900, uint64(block.timestamp));
        assertTrue(rhizome.isMember(alice), "should re-qualify once enough connections are fresh again");
    }

    function test_NonMember_NoConnectionsAtAll() public view {
        assertFalse(rhizome.isMember(alice));
    }

    function test_BootstrapMember_IsAlwaysMemberRegardlessOfConnections() public {
        vm.prank(creator);
        rhizome.addBootstrapMember(alice);
        assertTrue(rhizome.isMember(alice));
    }

    function test_CircularMembershipPrevention() public {
        vm.prank(creator);
        rhizome.addBootstrapMember(charlie);

        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);

        assertFalse(rhizome.isMember(alice));
        assertFalse(rhizome.isMember(bob));

        _registerConnection(alice, bob, 900, 1000);
        assertFalse(rhizome.isMember(alice));
        assertFalse(rhizome.isMember(bob));
    }

    function test_MembershipRequiringAllThreeAnchors() public {
        Rhizome strictRhizome = _deployRhizome("Strict", 30 days, 3);
        vm.startPrank(creator);
        strictRhizome.addBootstrapMember(bob);
        strictRhizome.addBootstrapMember(charlie);
        strictRhizome.addBootstrapMember(david);
        vm.stopPrank();

        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);
        _registerConnection(alice, charlie, 900, 1000);
        assertFalse(strictRhizome.isMember(alice), "needs all 3 anchors");

        _registerConnection(alice, david, 900, 1000);
        assertTrue(strictRhizome.isMember(alice));
    }

    function test_RemoveBootstrapMember_Success() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        rhizome.removeBootstrapMember(bob);
        vm.stopPrank();

        assertFalse(rhizome.isBootstrapMember(bob));
        assertFalse(rhizome.isMember(bob));

        address[] memory members = rhizome.getBootstrapMembers();
        assertEq(members.length, 1);
        assertEq(members[0], charlie);
    }

    function test_RemoveBootstrapMember_RevertNotCreator() public {
        vm.prank(creator);
        rhizome.addBootstrapMember(bob);

        vm.prank(alice);
        vm.expectRevert(Rhizome.NotCreator.selector);
        rhizome.removeBootstrapMember(bob);
    }

    function test_RemoveBootstrapMember_RevertNotBootstrapMember() public {
        vm.prank(creator);
        vm.expectRevert(Rhizome.NotBootstrapMember.selector);
        rhizome.removeBootstrapMember(bob);
    }

    function test_RemoveBootstrapMember_AllowsReAdditionAndFreesSlot() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        rhizome.addBootstrapMember(david);
        rhizome.removeBootstrapMember(bob);
        // slot freed, so a new member can be added without exceeding the cap
        rhizome.addBootstrapMember(eve);
        vm.stopPrank();

        address[] memory members = rhizome.getBootstrapMembers();
        assertEq(members.length, 3);
        assertFalse(rhizome.isBootstrapMember(bob));
        assertTrue(rhizome.isBootstrapMember(eve));
    }

    function test_MembershipChanges_AfterBootstrapMemberRemoval() public {
        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        vm.stopPrank();

        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);
        _registerConnection(alice, charlie, 900, 1000);
        assertTrue(rhizome.isMember(alice), "should qualify against both anchors");

        vm.prank(creator);
        rhizome.removeBootstrapMember(charlie);

        assertFalse(rhizome.isMember(alice), "should lose membership once an anchor is removed");
    }

    function test_TransferCreator_Success() public {
        vm.prank(creator);
        rhizome.transferCreator(alice);

        assertEq(rhizome.creator(), alice);

        // new creator can manage bootstrap membership
        vm.prank(alice);
        rhizome.addBootstrapMember(bob);
        assertTrue(rhizome.isBootstrapMember(bob));

        // old creator can no longer act
        vm.prank(creator);
        vm.expectRevert(Rhizome.NotCreator.selector);
        rhizome.addBootstrapMember(charlie);
    }

    function test_TransferCreator_RevertNotCreator() public {
        vm.prank(alice);
        vm.expectRevert(Rhizome.NotCreator.selector);
        rhizome.transferCreator(alice);
    }

    function test_TransferCreator_RevertZeroAddress() public {
        vm.prank(creator);
        vm.expectRevert(Rhizome.ZeroAddress.selector);
        rhizome.transferCreator(address(0));
    }
}
