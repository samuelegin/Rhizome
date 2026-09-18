// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RelationshipRegistry
/// @notice Onchain source of truth for Verified Connections. Envio derives relationship signals off Rio activity; an authorized registrar (an explicit, documented trust boundary see project spec section 4) submits the resulting connection here. Monad then enforces membership/rights off this state. This contract does not compute trust, reputation, or scores of any kind it only stores evidence of a signal type having qualified between two addresses, and lets freshness be derived from timestamps rather than stored as a flag.
contract RelationshipRegistry is Ownable {
    struct Connection {
        bytes32 signalType;
        uint32 evidenceCount;
        uint64 firstQualifiedAt;
        uint64 lastQualifiedAt;
        bytes32 evidenceRef;
        bool exists;
    }

    /// @notice The only address permitted to register/update connections.
    address public registrar;
    mapping(bytes32 => Connection) public connections;
    mapping(address => address[]) private _neighbors;
    mapping(address => mapping(address => bool)) private _isNeighbor;

    event RegistrarUpdated(address indexed oldRegistrar, address indexed newRegistrar);
    event ConnectionRegistered(
        bytes32 indexed connectionId,
        address indexed userA,
        address indexed userB,
        bytes32 signalType,
        uint32 evidenceCount,
        uint64 firstQualifiedAt,
        uint64 lastQualifiedAt,
        bytes32 evidenceRef
    );

    error NotRegistrar();
    error ZeroAddress();
    error SelfConnection();
    error InvalidTimestamps();

    modifier onlyRegistrar() {
        if (msg.sender != registrar) revert NotRegistrar();
        _;
    }

    constructor(address initialRegistrar, address initialOwner) Ownable(initialOwner) {
        if (initialRegistrar == address(0)) revert ZeroAddress();
        registrar = initialRegistrar;
        emit RegistrarUpdated(address(0), initialRegistrar);
    }

    function setRegistrar(address newRegistrar) external onlyOwner {
        if (newRegistrar == address(0)) revert ZeroAddress();
        address old = registrar;
        registrar = newRegistrar;
        emit RegistrarUpdated(old, newRegistrar);
    }

    function _normalize(address userA, address userB) internal pure returns (address, address) {
        return userA < userB ? (userA, userB) : (userB, userA);
    }

    function connectionId(address userA, address userB, bytes32 signalType) public pure returns (bytes32) {
        (address a, address b) = _normalize(userA, userB);
        return keccak256(abi.encodePacked(a, b, signalType));
    }

    function registerConnection(
        address userA,
        address userB,
        bytes32 signalType,
        uint32 evidenceCount,
        uint64 firstQualifiedAt,
        uint64 lastQualifiedAt,
        bytes32 evidenceRef
    ) external onlyRegistrar {
        if (userA == address(0) || userB == address(0)) revert ZeroAddress();
        if (userA == userB) revert SelfConnection();
        if (firstQualifiedAt > lastQualifiedAt) revert InvalidTimestamps();

        (address a, address b) = _normalize(userA, userB);
        bytes32 id = keccak256(abi.encodePacked(a, b, signalType));

        Connection storage c = connections[id];
        bool isNew = !c.exists;

        if (isNew) {
            c.exists = true;
            c.signalType = signalType;
            c.firstQualifiedAt = firstQualifiedAt;
        } else if (firstQualifiedAt < c.firstQualifiedAt) {
            c.firstQualifiedAt = firstQualifiedAt;
        }

        c.evidenceCount = evidenceCount;
        c.lastQualifiedAt = lastQualifiedAt;
        c.evidenceRef = evidenceRef;

        if (isNew && !_isNeighbor[a][b]) {
            _neighbors[a].push(b);
            _neighbors[b].push(a);
            _isNeighbor[a][b] = true;
            _isNeighbor[b][a] = true;
        }

        emit ConnectionRegistered(id, a, b, signalType, evidenceCount, c.firstQualifiedAt, lastQualifiedAt, evidenceRef);
    }

    function getConnection(address userA, address userB, bytes32 signalType) external view returns (Connection memory) {
        return connections[connectionId(userA, userB, signalType)];
    }

    function isConnectionActive(address userA, address userB, bytes32 signalType, uint64 freshnessPeriod)
        public
        view
        returns (bool)
    {
        Connection storage c = connections[connectionId(userA, userB, signalType)];
        if (!c.exists) return false;
        return block.timestamp <= uint256(c.lastQualifiedAt) + uint256(freshnessPeriod);
    }

    function getNeighbors(address user) external view returns (address[] memory) {
        return _neighbors[user];
    }
}
