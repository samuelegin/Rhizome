// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {TestBase} from "./TestBase.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract RioTokenTest is TestBase {
    function test_InitialSupplyMinted() public view {
        assertEq(rioToken.totalSupply(), 1_000_000 ether);
        assertEq(rioToken.balanceOf(owner), 1_000_000 ether);
    }

    function test_Metadata() public view {
        assertEq(rioToken.name(), "Rio Token");
        assertEq(rioToken.symbol(), "RIO");
        assertEq(rioToken.decimals(), 18);
    }

    function test_Transfer() public {
        vm.prank(owner);
        rioToken.transfer(alice, 100 ether);

        assertEq(rioToken.balanceOf(alice), 100 ether);
        assertEq(rioToken.balanceOf(owner), 1_000_000 ether - 100 ether);
    }

    function test_Transfer_RevertInsufficientBalance() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 0, 1 ether));
        rioToken.transfer(bob, 1 ether);
    }

    function test_ApproveAndTransferFrom() public {
        vm.prank(owner);
        rioToken.approve(alice, 50 ether);
        assertEq(rioToken.allowance(owner, alice), 50 ether);

        vm.prank(alice);
        rioToken.transferFrom(owner, bob, 50 ether);

        assertEq(rioToken.balanceOf(bob), 50 ether);
        assertEq(rioToken.allowance(owner, alice), 0);
    }

    function test_Mint_OnlyOwner() public {
        vm.prank(owner);
        rioToken.mint(alice, 10 ether);
        assertEq(rioToken.balanceOf(alice), 10 ether);
    }

    function test_Mint_RevertNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        rioToken.mint(alice, 10 ether);
    }
}
