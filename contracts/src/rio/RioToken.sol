// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RioToken
/// @notice Plain OpenZeppelin ERC20 used only to give the Rio demo environment something to stake/govern with. Rhizome membership never depends on holding this token Rio is an evidence source, not a gate.
contract RioToken is ERC20, Ownable {
    constructor(uint256 initialSupply, address initialOwner) ERC20("Rio Token", "RIO") Ownable(initialOwner) {
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
    }

    /// @notice Mint additional demo tokens owner-gated only so the hackathon demo can top up test wallets; not part of any tokenomics design.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
