// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RioStaking
/// @notice Plain stake/unstake contract with no rewards, yield or emissions. Exists purely as a second observable Rio activity source; the MVP's only relationship signal (SHARED_GOVERNANCE) does not read from it.
contract RioStaking is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    mapping(address => uint256) public stakedBalance;

    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);

    error ZeroAmount();
    error InsufficientBalance();
    error ZeroAddress();

    constructor(address stakingTokenAddress) {
        if (stakingTokenAddress == address(0)) revert ZeroAddress();
        stakingToken = IERC20(stakingTokenAddress);
    }

    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        stakedBalance[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, block.timestamp);
    }

    function unstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 bal = stakedBalance[msg.sender];
        if (bal < amount) revert InsufficientBalance();
        stakedBalance[msg.sender] = bal - amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    function isStaking(address user) external view returns (bool) {
        return stakedBalance[user] > 0;
    }

    function balanceOf(address user) external view returns (uint256) {
        return stakedBalance[user];
    }
}
