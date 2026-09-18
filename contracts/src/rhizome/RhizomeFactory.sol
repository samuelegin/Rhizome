// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Rhizome} from "./Rhizome.sol";

/// @title RhizomeFactory
/// @notice Deploys Rhizome community instances against a shared RelationshipRegistry. The caller of createRhizome becomes the Rhizome's creator (bootstrap admin) automatically.
contract RhizomeFactory {
    struct RhizomeConfig {
        string name;
        bytes32 signalType;
        uint64 freshnessPeriod;
        uint16 minimumConnections;
        address creator;
    }

    address public immutable registry;
    address[] private _allRhizomes;
    mapping(address => RhizomeConfig) public rhizomeConfigs;

    event RhizomeCreated(
        address indexed rhizome,
        address indexed creator,
        string name,
        bytes32 signalType,
        uint64 freshnessPeriod,
        uint16 minimumConnections
    );

    error ZeroAddress();

    constructor(address registryAddress) {
        if (registryAddress == address(0)) revert ZeroAddress();
        registry = registryAddress;
    }

    function createRhizome(string calldata name, bytes32 signalType, uint64 freshnessPeriod, uint16 minimumConnections)
        external
        returns (address rhizomeAddress)
    {
        Rhizome rhizome = new Rhizome(registry, name, signalType, freshnessPeriod, minimumConnections, msg.sender);
        rhizomeAddress = address(rhizome);

        _allRhizomes.push(rhizomeAddress);
        rhizomeConfigs[rhizomeAddress] = RhizomeConfig({
            name: name,
            signalType: signalType,
            freshnessPeriod: freshnessPeriod,
            minimumConnections: minimumConnections,
            creator: msg.sender
        });

        emit RhizomeCreated(rhizomeAddress, msg.sender, name, signalType, freshnessPeriod, minimumConnections);
    }

    function getAllRhizomes() external view returns (address[] memory) {
        return _allRhizomes;
    }

    function allRhizomesLength() external view returns (uint256) {
        return _allRhizomes.length;
    }
}
