pragma solidity ^0.7.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/Ixfai.sol";

contract LiquidityInitialiser is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IUniswapV2Router02 private constant uniswapRouter =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    address public xfitToken;

    address public xfai;

    uint256 public cliff;

    uint256 public startTime;

    struct Investment {
        uint256 amount;
        uint256 claimedRewards;
        bool redeemedCapital;
    }

    mapping(address => uint256) public totalFunds;

    mapping(address => uint256) public totalRewards;

    mapping(address => mapping(address => Investment)) public investments;

    address[] public investmentTokens;

    constructor(address _xfai, uint256 _cliff) {
        xfai = _xfai;
        cliff = _cliff;
        startTime = block.timestamp;
        addInvestmentToken(0xCB346131339cC001a56d8178E28eC2A15254Cd31);
        addInvestmentToken(0x8b5DEB679F3242aEf2A43F199d539dF0Ba360625);
    }

    modifier onlyAfterCliff() {
        require(
            startTime.add(cliff) > block.timestamp,
            "Cannot withdraw before cliff period is over"
        );
        _;
    }

    function addInvestmentToken(address token) public onlyOwner {
        uint256 poolIndex = _getPoolIndex(token);
        require(
            poolIndex == investmentTokens.length,
            "investmentTokens and poolIndex mismatch"
        );
        investmentTokens.push(token);
    }

    function addFunds(
        address _investor,
        uint256 _amount,
        address _currency
    ) public {
        IERC20(_currency).safeTransferFrom(msg.sender, address(this), _amount);
        investments[_investor][_currency].amount = investments[_investor][
            _currency
        ]
            .amount
            .add(_amount);
        totalFunds[_currency] = totalFunds[_currency].add(_amount);
    }

    function batchAddFunds(
        address[] memory _investors,
        uint256[] memory _amounts,
        address[] memory _currencies
    ) public {
        require(
            _investors.length == _amounts.length,
            "Investors and Amounts array mismatch"
        );
        require(
            _currencies.length == _amounts.length,
            "Investors and Amounts array mismatch"
        );
        for (uint256 i = 0; i < _amounts.length; i++) {
            addFunds(_investors[i], _amounts[i], _currencies[i]);
        }
    }

    function bootstrapLiquidityPools(uint256[] memory _initPrices)
        public
        onlyOwner
    {
        require(
            _initPrices.length == investmentTokens.length,
            "Invalid currencies and prices array lengths"
        );
        for (uint256 i = 0; i < investmentTokens.length; i++) {
            require(
                totalFunds[investmentTokens[i]] > 0,
                "No funds collected for this currency"
            );

            (, address inputToken, , , , ) = Ixfai(xfai).poolInfo(i);

            require(inputToken == investmentTokens[i], "pool index mismatch");

            IERC20(investmentTokens[i]).safeApprove(address(uniswapRouter), 0);
            IERC20(xfitToken).safeApprove(address(uniswapRouter), 0);

            uint256 baseTokenAmount = totalFunds[investmentTokens[i]];
            uint256 xfitEquivalent = baseTokenAmount.mul(_initPrices[i]);

            IERC20(investmentTokens[i]).safeApprove(
                address(uniswapRouter),
                baseTokenAmount
            );

            IERC20(xfitToken).safeApprove(
                address(uniswapRouter),
                xfitEquivalent
            );

            (, , uint256 LP) =
                uniswapRouter.addLiquidity(
                    address(investmentTokens[i]),
                    xfitToken,
                    baseTokenAmount,
                    xfitEquivalent,
                    1,
                    1,
                    address(this),
                    0xf000000000000000000000000000000000000000000000000000000000000000
                );

            Ixfai(xfai).depositLP(i, LP);
        }
    }

    function claimRewards() public {
        for (uint256 i = 0; i < investmentTokens.length; i++) {
            Investment storage investment =
                investments[msg.sender][investmentTokens[i]];
            // Claim the rewards
            if (investment.amount > 0 && investment.redeemedCapital == true) {
                uint256 preBalance =
                    IERC20(investmentTokens[i]).balanceOf(address(this));

                Ixfai(xfai).depositLP(i, 0);

                uint256 postBalance =
                    IERC20(investmentTokens[i]).balanceOf(address(this));

                totalRewards[investmentTokens[i]] = totalRewards[
                    investmentTokens[i]
                ]
                    .add(postBalance.sub(preBalance));

                uint256 investmentShare =
                    investment.amount.mul(1e18).div(
                        totalFunds[investmentTokens[i]]
                    );

                uint256 rewardShare =
                    investmentShare.mul(totalRewards[investmentTokens[i]]).div(
                        1e18
                    );

                uint256 claimableRewards =
                    rewardShare.sub(investment.claimedRewards);

                investment.claimedRewards = investment.claimedRewards.add(
                    claimableRewards
                );

                // transfer out the rewards
                IERC20(investmentTokens[i]).safeTransfer(
                    msg.sender,
                    claimableRewards
                );
            }
        }
    }

    function redeemCapital(address currency) public onlyAfterCliff {
        Investment storage investment = investments[msg.sender][currency];
        require(investment.amount > 0, "Investment not found");
        uint256 poolIndex = _getPoolIndex(currency);
        uint256 investmentShare =
            investment.amount.mul(1e18).div(totalFunds[currency]);
        (uint256 lpAmount, , , ) =
            Ixfai(xfai).userInfo(poolIndex, address(this));
        uint256 lpShare = investmentShare.mul(lpAmount).div(1e18);
        if (lpShare > 0) {
            (address lpToken, , , , , ) = Ixfai(xfai).poolInfo(poolIndex);
            Ixfai(xfai).withdrawLP(poolIndex, lpShare);
            claimRewards();
            investment.redeemedCapital = true;
            IERC20(lpToken).transfer(msg.sender, lpShare);
        }
    }

    function _getPoolIndex(address currency) internal returns (uint256) {
        uint256 i = 0;
        while (true) {
            require(i <= 10, "token not found in XFai");
            (, address inputToken, , , , ) = Ixfai(xfai).poolInfo(i);
            if (inputToken == currency) {
                break;
            }
            i++;
        }
        return i;
    }
}
