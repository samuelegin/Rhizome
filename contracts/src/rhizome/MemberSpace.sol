// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Rhizome} from "./Rhizome.sol";

/// @title MemberSpace
/// @notice Deliberately trivial contract whose only job is to prove that Rhizome membership is an enforceable onchain right, not just an analytics label. A non-member's post() call reverts.
contract MemberSpace {
    Rhizome public immutable rhizome;

    event PostCreated(address indexed author, bytes32 indexed contentHash, uint256 timestamp);

    error ZeroAddress();

    modifier onlyMember() {
        require(rhizome.isMember(msg.sender), "Not a Rhizome member");
        _;
    }

    constructor(address rhizomeAddress) {
        if (rhizomeAddress == address(0)) revert ZeroAddress();
        rhizome = Rhizome(rhizomeAddress);
    }

    function post(bytes32 contentHash) external onlyMember {
        emit PostCreated(msg.sender, contentHash, block.timestamp);
    }
}
