pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// StackToken with Governance.
contract MockErc20 is ERC20, Ownable {
    constructor(uint256 initialSupply, uint8 _decimals)
        public
        ERC20("USDTether", "USDT")
    {
        _setupDecimals(_decimals);
        _mint(msg.sender, initialSupply);
    }

    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner.
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}
