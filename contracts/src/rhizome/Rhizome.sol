// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {RelationshipRegistry} from "./RelationshipRegistry.sol";

/// @title Rhizome
/// @notice A single rule-defined community membership is derived on read from active Verified Connections in the RelationshipRegistry it is never a permanently-stored boolean for normal members.

contract Rhizome {
    uint8 public constant MAX_BOOTSTRAP_MEMBERS = 3;

    RelationshipRegistry public immutable registry;
    string public name;
    bytes32 public immutable signalType;
    uint64 public immutable freshnessPeriod;
    uint16 public immutable minimumConnections;
    address public creator;

    address[] private _bootstrapMembers;
    mapping(address => bool) public isBootstrapMember;
    mapping(address => uint256) private _bootstrapMemberIndex;

    event BootstrapMemberAdded(address indexed member);
    event BootstrapMemberRemoved(address indexed member);
    event CreatorTransferred(address indexed oldCreator, address indexed newCreator);

    error NotCreator();
    error ZeroAddress();
    error BootstrapLimitReached();
    error AlreadyBootstrapMember();
    error NotBootstrapMember();
    error InvalidConfig();

    modifier onlyCreator() {
        if (msg.sender != creator) revert NotCreator();
        _;
    }

    constructor(
        address registryAddress,
        string memory name_,
        bytes32 signalType_,
        uint64 freshnessPeriod_,
        uint16 minimumConnections_,
        address creator_
    ) {
        if (registryAddress == address(0) || creator_ == address(0)) revert ZeroAddress();
        if (minimumConnections_ == 0 || minimumConnections_ > MAX_BOOTSTRAP_MEMBERS) revert InvalidConfig();
        if (freshnessPeriod_ == 0) revert InvalidConfig();

        registry = RelationshipRegistry(registryAddress);
        name = name_;
        signalType = signalType_;
        freshnessPeriod = freshnessPeriod_;
        minimumConnections = minimumConnections_;
        creator = creator_;
    }

    function addBootstrapMember(address member) external onlyCreator {
        if (member == address(0)) revert ZeroAddress();
        if (_bootstrapMembers.length >= MAX_BOOTSTRAP_MEMBERS) revert BootstrapLimitReached();
        if (isBootstrapMember[member]) revert AlreadyBootstrapMember();

        isBootstrapMember[member] = true;
        _bootstrapMemberIndex[member] = _bootstrapMembers.length;
        _bootstrapMembers.push(member);
        emit BootstrapMemberAdded(member);
    }

    function removeBootstrapMember(address member) external onlyCreator {
        if (!isBootstrapMember[member]) revert NotBootstrapMember();

        uint256 index = _bootstrapMemberIndex[member];
        uint256 lastIndex = _bootstrapMembers.length - 1;
        if (index != lastIndex) {
            address lastMember = _bootstrapMembers[lastIndex];
            _bootstrapMembers[index] = lastMember;
            _bootstrapMemberIndex[lastMember] = index;
        }
        _bootstrapMembers.pop();
        delete _bootstrapMemberIndex[member];
        isBootstrapMember[member] = false;

        emit BootstrapMemberRemoved(member);
    }

    function transferCreator(address newCreator) external onlyCreator {
        if (newCreator == address(0)) revert ZeroAddress();
        address old = creator;
        creator = newCreator;
        emit CreatorTransferred(old, newCreator);
    }

    function getBootstrapMembers() external view returns (address[] memory) {
        return _bootstrapMembers;
    }

    function isMember(address user) public view returns (bool) {
        if (isBootstrapMember[user]) return true;

        uint256 qualifying = 0;
        uint256 len = _bootstrapMembers.length;
        for (uint256 i = 0; i < len; i++) {
            address anchor = _bootstrapMembers[i];
            if (registry.isConnectionActive(user, anchor, signalType, freshnessPeriod)) {
                qualifying++;
                if (qualifying >= minimumConnections) {
                    return true;
                }
            }
        }
        return false;
    }

    function getConfig()
        external
        view
        returns (
            address registryAddress,
            string memory name_,
            bytes32 signalType_,
            uint64 freshnessPeriod_,
            uint16 minimumConnections_,
            address creator_
        )
    {
        return (address(registry), name, signalType, freshnessPeriod, minimumConnections, creator);
    }
}
