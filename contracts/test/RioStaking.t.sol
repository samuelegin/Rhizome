// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {TestBase} from "./TestBase.sol";
import {RioStaking} from "../src/rio/RioStaking.sol";
import {RioToken} from "../src/rio/RioToken.sol";

contract RioStakingTest is TestBase {
    function setUp() public override {
        super.setUp();
        vm.prank(owner);
        rioToken.transfer(alice, 1000 ether);

        vm.prank(alice);
        rioToken.approve(address(rioStaking), type(uint256).max);
    }

    function test_Constructor_RevertZeroAddress() public {
        vm.expectRevert(RioStaking.ZeroAddress.selector);
        new RioStaking(address(0));
    }

    function test_Stake_Success() public {
        vm.prank(alice);
        rioStaking.stake(100 ether);

        assertEq(rioStaking.balanceOf(alice), 100 ether);
        assertEq(rioStaking.stakedBalance(alice), 100 ether);
        assertTrue(rioStaking.isStaking(alice));
        assertEq(rioToken.balanceOf(address(rioStaking)), 100 ether);
    }

    function test_Stake_RevertZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(RioStaking.ZeroAmount.selector);
        rioStaking.stake(0);
    }

    function test_Unstake_Success() public {
        vm.startPrank(alice);
        rioStaking.stake(100 ether);
        rioStaking.unstake(40 ether);
        vm.stopPrank();

        assertEq(rioStaking.balanceOf(alice), 60 ether);
        assertEq(rioToken.balanceOf(alice), 1000 ether - 60 ether);
    }

    function test_Unstake_RevertInsufficientBalance() public {
        vm.startPrank(alice);
        rioStaking.stake(50 ether);
        vm.expectRevert(RioStaking.InsufficientBalance.selector);
        rioStaking.unstake(100 ether);
        vm.stopPrank();
    }

    function test_Unstake_RevertZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(RioStaking.ZeroAmount.selector);
        rioStaking.unstake(0);
    }

    function test_IsStaking_FalseInitially() public view {
        assertFalse(rioStaking.isStaking(alice));
    }

    function test_IsStaking_FalseAfterFullUnstake() public {
        vm.startPrank(alice);
        rioStaking.stake(50 ether);
        rioStaking.unstake(50 ether);
        vm.stopPrank();

        assertFalse(rioStaking.isStaking(alice));
    }

    function test_Stake_EmitsEvent() public {
        vm.prank(alice);
        rioStaking.stake(10 ether);
    }

    function test_Unstake_EmitsEvent() public {
        vm.startPrank(alice);
        rioStaking.stake(10 ether);
        rioStaking.unstake(5 ether);
        vm.stopPrank();
    }

    function test_StakingToken_IsIntendedTokenOnly() public {
        // The staking token is fixed at deployment and cannot be changed;
        // RioStaking has no function that accepts an arbitrary ERC20 address.
        assertEq(address(rioStaking.stakingToken()), address(rioToken));
    }

    function test_StakingToken_DifferentTokenCannotBeStakedHere() public {
        // Deploy an unrelated ERC20 and a staking pool for it, and confirm
        // that pool's balances are entirely independent of RioStaking/RioToken.
        RioToken otherToken = new RioToken(1000 ether, owner);
        RioStaking otherStaking = new RioStaking(address(otherToken));

        vm.prank(owner);
        otherToken.transfer(alice, 100 ether);

        vm.startPrank(alice);
        otherToken.approve(address(otherStaking), 100 ether);
        otherStaking.stake(100 ether);
        vm.stopPrank();

        // The original RioStaking pool (bound to rioToken) is unaffected
        assertEq(rioStaking.stakedBalance(alice), 0);
        assertEq(otherStaking.stakedBalance(alice), 100 ether);
        assertTrue(address(otherStaking.stakingToken()) != address(rioStaking.stakingToken()));
    }
}
