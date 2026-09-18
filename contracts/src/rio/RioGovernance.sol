// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title RioGovernance
/// @notice Minimal governance contract whose sole purpose is to generate observable onchain evidence (VoteCast) that Envio can later turn into SHARED_GOVERNANCE relationship signals. It is intentionally not token-weighted and has no quorum/execution logic — governance outcomes are not the point, the voting activity is.
contract RioGovernance {
    enum Support {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        address creator;
        string title;
        string description;
        uint64 startTime;
        uint64 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title);
    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 timestamp);

    error InvalidTimeWindow();
    error ProposalDoesNotExist();
    error VotingNotOpen();
    error AlreadyVoted();
    error InvalidSupport();

    function createProposal(string calldata title, string calldata description, uint64 startTime, uint64 endTime)
        external
        returns (uint256 proposalId)
    {
        if (endTime <= startTime) revert InvalidTimeWindow();

        proposalId = proposalCount;
        proposalCount = proposalCount + 1;

        proposals[proposalId] = Proposal({
            creator: msg.sender,
            title: title,
            description: description,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0
        });

        emit ProposalCreated(proposalId, msg.sender, title);
    }

    function vote(uint256 proposalId, uint8 support) external {
        if (proposalId >= proposalCount) revert ProposalDoesNotExist();
        if (support > uint8(Support.Abstain)) revert InvalidSupport();

        Proposal storage p = proposals[proposalId];
        if (block.timestamp < p.startTime || block.timestamp > p.endTime) revert VotingNotOpen();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        hasVoted[proposalId][msg.sender] = true;

        if (support == uint8(Support.For)) {
            p.forVotes += 1;
        } else if (support == uint8(Support.Against)) {
            p.againstVotes += 1;
        } else {
            p.abstainVotes += 1;
        }

        emit VoteCast(msg.sender, proposalId, support, block.timestamp);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        if (proposalId >= proposalCount) revert ProposalDoesNotExist();
        return proposals[proposalId];
    }
}
