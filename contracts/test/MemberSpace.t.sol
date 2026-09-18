// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {TestBase} from "./TestBase.sol";
import {Rhizome} from "../src/rhizome/Rhizome.sol";
import {MemberSpace} from "../src/rhizome/MemberSpace.sol";

contract MemberSpaceTest is TestBase {
    Rhizome rhizome;
    MemberSpace memberSpace;

    function setUp() public override {
        super.setUp();
        rhizome = _deployRhizome("Monad Builders", 30 days, 2);
        memberSpace = new MemberSpace(address(rhizome));

        vm.startPrank(creator);
        rhizome.addBootstrapMember(bob);
        rhizome.addBootstrapMember(charlie);
        vm.stopPrank();
    }

    function test_Constructor_RevertZeroAddress() public {
        vm.expectRevert(MemberSpace.ZeroAddress.selector);
        new MemberSpace(address(0));
    }

    function test_Member_CanPost() public {
        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);
        _registerConnection(alice, charlie, 900, 1000);
        assertTrue(rhizome.isMember(alice));

        vm.prank(alice);
        memberSpace.post(keccak256("hello rhizome"));
    }

    function test_BootstrapMember_CanPost() public {
        vm.prank(bob);
        memberSpace.post(keccak256("hello from anchor"));
    }

    function test_NonMember_CannotPost() public {
        vm.prank(alice); // alice has zero connections
        vm.expectRevert("Not a Rhizome member");
        memberSpace.post(keccak256("hello rhizome"));
    }

    function test_FormerMember_LosesAccessAfterExpiry() public {
        vm.warp(1000);
        _registerConnection(alice, bob, 900, 1000);
        _registerConnection(alice, charlie, 900, 1000);

        vm.prank(alice);
        memberSpace.post(keccak256("still a member"));

        vm.warp(1000 + 30 days + 1);
        vm.prank(alice);
        vm.expectRevert("Not a Rhizome member");
        memberSpace.post(keccak256("no longer a member"));
    }

    function test_Post_EmitsEvent() public {
        vm.prank(bob);
        memberSpace.post(keccak256("content"));
    }
}
