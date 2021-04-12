// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface Ixfai {
    function depositLP(uint256 _pid, uint256 _amount) external;

    function depositLPWithToken(
        uint256 _pid,
        uint256 _amount,
        uint256 _minPoolTokens
    ) external;

    function withdrawLPWithToken(uint256 _pid, uint256 _amount) external;

    function withdrawLP(uint256 _pid, uint256 _amount) external;

    function pendingXFIT(uint256 _pid, address _user)
        external
        view
        returns (uint256);

    function poolInfo(uint256 _pid)
        external
        view
        returns (
            address lpToken, // Address of LP token contract.
            address inputToken, // Token in which Single sided liquidity can be provided
            address xPoolOracle,
            uint256 allocPoint, // How many allocation points assigned to this pool. XFITs to distribute per block.
            uint256 lastRewardBlock, // Last block number that XFITs distribution occurs.
            uint256 accXFITPerShare // Accumulated XFITs per share, times 1e18. See below.
        );

    function userInfo(uint256 _pid, address user)
        external
        view
        returns (
            uint256 amount, // How many LP tokens the user has provided.
            uint256 rewardDebt, // Reward debt. See explanation below.
            bool enrolled,
            uint256 lastDepositedBlock
        );
}
