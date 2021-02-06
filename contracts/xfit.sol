// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/Ixfit.sol";

contract Xfit is Ownable, ERC20, Ixfit {

    constructor(
        string memory _name,
        string memory _symbol
    ) public ERC20(_name,_symbol) {}

    function mint(address account, uint256 amount) external override onlyOwner returns (bool) {
        _mint(account, amount);
        return true;
    }
}
