// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {TestBase} from "./TestBase.sol";
import {RioGovernance} from "../src/rio/RioGovernance.sol";

contract RioGovernanceTest is TestBase {
    function test_CreateProposal() public {
        vm.warp(1000);
        uint256 id = rioGovernance.createProposal("Title", "Description", 1000, 2000);
        assertEq(id, 0);
        assertEq(rioGovernance.proposalCount(), 1);

        RioGovernance.Proposal memory p = rioGovernance.getProposal(id);
        assertEq(p.title, "Title");
        assertEq(p.creator, address(this));
        assertEq(p.startTime, 1000);
        assertEq(p.endTime, 2000);
    }

    function test_CreateProposal_RevertInvalidTimeWindow() public {
        vm.expectRevert(RioGovernance.InvalidTimeWindow.selector);
        rioGovernance.createProposal("Title", "Description", 2000, 1000);
    }

    function test_Vote_For() public {
        vm.warp(1000);
        uint256 id = rioGovernance.createProposal("Title", "Description", 1000, 2000);

        vm.prank(alice);
        rioGovernance.vote(id, uint8(RioGovernance.Support.For));

        RioGovernance.Proposal memory p = rioGovernance.getProposal(id);
        assertEq(p.forVotes, 1);
        assertEq(p.againstVotes, 0);
        assertEq(p.abstainVotes, 0);
        assertTrue(rioGovernance.hasVoted(id, alice));
    }

    function test_Vote_Against() public {
        vm.warp(1000);
        uint256 id = rioGovernance.createProposal("Title", "Description", 1000, 2000);

        vm.prank(alice);
        rioGovernance.vote(id, uint8(RioGovernance.Support.Against));

        RioGovernance.Proposal memory p = rioGovernance.getProposal(id);
        assertEq(p.againstVotes, 1);
    }

    function test_Vote_Abstain() public {
        vm.warp(1000);
        uint256 id = rioGovernance.createProposal("Title", "Description", 1000, 2000);

        vm.prank(alice);
        rioGovernance.vote(id, uint8(RioGovernance.Support.Abstain));

        RioGovernance.Proposal memory p = rioGovernance.getProposal(id);
        assertEq(p.abstainVotes, 1);
    }

    function test_Vote_DuplicateVotingPrevented() public {
        vm.warp(1000);
        uint256 id = rioGovernance.createProposal("Title", "Description", 1000, 2000);

        vm.startPrank(alice);
        rioGovernance.vote(id, uint8(RioGovernance.Support.For));
        vm.expectRevert(RioGovernance.AlreadyVoted.selector);
        rioGovernance.vote(id, uint8(RioGovernance.Support.Against));
        vm.stopPrank();
    }

    function test_Vote_RevertProposalDoesNotExist() public {
        vm.expectRevert(RioGovernance.ProposalDoesNotExist.selector);
        rioGovernance.vote(999, uint8(RioGovernance.Support.For));
    }

    function test_Vote_RevertBeforeStart() public {
        vm.warp(500);
        uint256 id = rioGovernance.createProposal("Title", "Description", 1000, 2000);

        vm.expectRevert(RioGovernance.VotingNotOpen.selector);
        rioGovernance.vote(id, uint8(RioGovernance.Support.For));
    }

    function test_Vote_RevertAfterEnd() public {
        vm.warp(1000);
        uint256 id = rioGovernance.createProposal("Title", "Description", 1000, 2000);

        vm.warp(2001);
        vm.expectRevert(RioGovernance.VotingNotOpen.selector);
        rioGovernance.vote(id, uint8(RioGovernance.Support.For));
    }

    function test_Vote_RevertInvalidSupportValue() public {
        vm.warp(1000);
        uint256 id = rioGovernance.createProposal("Title", "Description", 1000, 2000);

        vm.expectRevert(RioGovernance.InvalidSupport.selector);
        rioGovernance.vote(id, 3);
    }

    function test_GetProposal_RevertDoesNotExist() public {
        vm.expectRevert(RioGovernance.ProposalDoesNotExist.selector);
        rioGovernance.getProposal(0);
    }

    function test_MultipleVotersSharedProposals_GeneratesEvidenceBase() public {
        vm.warp(1000);
        uint256 p1 = rioGovernance.createProposal("P1", "D1", 1000, 2000);
        uint256 p2 = rioGovernance.createProposal("P2", "D2", 1000, 2000);

        vm.prank(alice);
        rioGovernance.vote(p1, uint8(RioGovernance.Support.For));
        vm.prank(bob);
        rioGovernance.vote(p1, uint8(RioGovernance.Support.For));

        vm.prank(alice);
        rioGovernance.vote(p2, uint8(RioGovernance.Support.Against));
        vm.prank(bob);
        rioGovernance.vote(p2, uint8(RioGovernance.Support.Against));

        assertTrue(rioGovernance.hasVoted(p1, alice));
        assertTrue(rioGovernance.hasVoted(p1, bob));
        assertTrue(rioGovernance.hasVoted(p2, alice));
        assertTrue(rioGovernance.hasVoted(p2, bob));
    }
}
