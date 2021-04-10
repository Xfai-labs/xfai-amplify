const { artifacts, assert, expect, web3 } = require("hardhat");
const {
  expectRevert,
  time,
  BN,
  expectEvent,
} = require("@openzeppelin/test-helpers");

const XFit = artifacts.require("Xfit");
const XFai = artifacts.require("XFai");
const XPriceOracle = artifacts.require("XPriceOracle");
const treasury = "0x0EC23E0d5Db74275Aa6B2A7bECec970A3636Db20";
const USDT_XFIT_PAIR = "0x64012fdcB2BC4aeB8072b54579742A5c81B24De7";
const DAI_XFIT_PAIR = "0xd60620461e1A8652d2746f173789947293c8e6C3";

const usdtXFitPairContract = new web3.eth.Contract(
  require("./abis/UniswapV2Pair.abi.json"),
  USDT_XFIT_PAIR
);

const daiXFitPairContract = new web3.eth.Contract(
  require("./abis/UniswapV2Pair.abi.json"),
  DAI_XFIT_PAIR
);

async function impersonateAccount(account) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });
}

async function fundAccount(account, funder) {
  await web3.eth.sendTransaction({
    from: funder,
    value: web3.utils.toWei("5"),
    to: account,
  });
}

async function mineBlocks() {
  await network.provider.request({
    method: "evm_mine",
  });
}

describe("XFai Scenario", function () {
  let admin;
  let dev;
  let users;
  let xfai;
  let xfit;
  let usdt;
  let xPriceOracleUSDT;
  let xPriceOracleDAI;
  before(async () => {
    [admin, dev, ...users] = await web3.eth.getAccounts();
    await impersonateAccount(treasury);
    xfit = await XFit.at("0xc5e427321f9fe11bd2990127bfde89da666eb31b");
    // await xfit.mint(treasury, "1000000000000000000000000000000", {
    //   from: treasury,
    // });

    await impersonateAccount(admin);
    xfai = await XFai.new(
      xfit.address,
      dev, // Dev Address
      "100", // Drip rate
      24163844, // Reward start block
      24163848, // Bonus rewards end block
      "5000000000000000000000", // xFitThreeshold
      "500000000000000000", //FundsSplitFactor);
      { from: admin }
    );

    // Add USDT pool
    usdt = await XFit.at("0xcb346131339cc001a56d8178e28ec2a15254cd31");
    xPriceOracleUSDT = await XPriceOracle.new(
      USDT_XFIT_PAIR // Pair address
    );
    await xPriceOracleUSDT.update();
    await xfai.add(
      USDT_XFIT_PAIR, // Pair address
      usdt.address, // Input Token
      xPriceOracleUSDT.address,
      true
    );

    // Add DAI pool
    dai = await XFit.at("0x8b5DEB679F3242aEf2A43F199d539dF0Ba360625");
    xPriceOracleDAI = await XPriceOracle.new(
      DAI_XFIT_PAIR // Pair address
    );
    await xPriceOracleDAI.update();
    await xfai.add(
      DAI_XFIT_PAIR, // Pair address
      dai.address, // Input Token
      xPriceOracleDAI.address,
      true
    );

    await impersonateAccount(treasury);
    await xfit.transfer(xfai.address, "100000000000000000000000", {
      from: treasury,
    });
    // Distribute USDT to users
    await usdt.transfer(users[0], "10000000000", { from: treasury });
    await usdt.transfer(users[1], "100000000", { from: treasury });
    await usdt.transfer(users[2], "100000000", { from: treasury });

    // Distribute DAI to users
    await dai.transfer(users[0], "1000000000000000000000", { from: treasury });
    await dai.transfer(users[1], "10000000000000000000", { from: treasury });
    await dai.transfer(users[2], "10000000000000000000", { from: treasury });
  });

  describe("Initial Setup", async () => {
    it("should return nonzero USDT tokens balance for treasury", async () => {
      const balance = await usdt.balanceOf(treasury);
      expect(new BN(balance).gt(new BN("0"))).to.be.true;
    });
    it("should return correct USDT tokens balance for users", async () => {
      const balance = await usdt.balanceOf(users[0]);
      expect(new BN(balance).eq(new BN("10000000000"))).to.be.true;
    });
    it("should return correct info from XFai", async () => {
      const xFitBalance = await xfit.balanceOf(xfai.address);
      const dripRate = await xfai.XFITPerBlock();
      expect(new BN(xFitBalance).eq(new BN("100000000000000000000000"))).to.be
        .true;
      expect(new BN(dripRate).eq(new BN("100"))).to.be.true;
    });
  });

  describe("Farming: Single sided liquidity", async () => {
    it("fails if invalid amount of input token is deposted", async () => {
      await impersonateAccount(users[0]);
      await usdt.approve(xfai.address, "1000", { from: users[0] });
      await expectRevert(
        xfai.depositLPWithToken(0, "2000", 1, { from: users[0] }),
        "ERC20: transfer amount exceeds allowance"
      );
    });
    describe("When Contract has enough XFit", async () => {
      it("Uses Internal Reserves to Swap input token instead of Uniswap", async () => {
        await impersonateAccount(users[0]);
        const expectedXFit = await xPriceOracleUSDT.consult(
          usdt.address,
          "500"
        );
        const fundsSplitFactor = await xfai.fundsSplitFactor();
        const continousFunding = new BN("500")
          .mul(fundsSplitFactor)
          .div(new BN("1000000000000000000"));
        const preFunding = await usdt.balanceOf(dev);
        await usdt.approve(xfai.address, "1000", { from: users[0] });
        const receipt = await xfai.depositLPWithToken(0, "1000", 1, {
          from: users[0],
        });
        const postFunding = await usdt.balanceOf(dev);
        expect(postFunding.sub(preFunding).toString()).equals(
          new BN("500").sub(continousFunding).toString()
        );
        await expectEvent(receipt.receipt, "INTERNAL_SWAP", {
          sender: users[0],
          tokensBought: expectedXFit,
        });

        // Swapped portion of incoming funding to buy back XFit
        await expectEvent(receipt.receipt, "SWAP_TOKENS", {
          sender: users[0],
          amount: new BN("250"),
          fromToken: usdt.address,
          toToken: xfit.address,
        });
      });

      it("Behaves correctly when multiple users interact with the contract", async () => {
        await impersonateAccount(users[0]);
        const expectedXFit = await xPriceOracleUSDT.consult(
          usdt.address,
          "500"
        );
        await usdt.approve(xfai.address, "1000", { from: users[0] });
        const receipt = await xfai.depositLPWithToken(0, "1000", 1, {
          from: users[0],
        });
        await expectEvent(receipt.receipt, "INTERNAL_SWAP", {
          sender: users[0],
          tokensBought: expectedXFit,
        });

        await impersonateAccount(users[1]);
        const expectedXFit2 = await xPriceOracleUSDT.consult(
          usdt.address,
          "1000"
        );
        await usdt.approve(xfai.address, "2000", { from: users[1] });
        const receipt2 = await xfai.depositLPWithToken(0, "2000", 1, {
          from: users[1],
        });
        await expectEvent(receipt2.receipt, "INTERNAL_SWAP", {
          sender: users[1],
          tokensBought: expectedXFit2,
        });

        await impersonateAccount(users[2]);
        const expectedXFit3 = await xPriceOracleUSDT.consult(
          usdt.address,
          "1000"
        );
        await usdt.approve(xfai.address, "2000", { from: users[2] });
        const receipt3 = await xfai.depositLPWithToken(0, "2000", 1, {
          from: users[2],
        });
        await expectEvent(receipt3.receipt, "INTERNAL_SWAP", {
          sender: users[2],
          tokensBought: expectedXFit3,
        });
      });
      it("Distributes rewards correctly", async () => {
        await mineBlocks();
        await mineBlocks();
        // 100 + 100 + 50 + 50 + 33.33 + 33.33
        const totalExpectedRewards = new BN("367");
        const accumulatedRewards = await xfai.pendingXFIT(0, users[0]);
        expect(totalExpectedRewards.toString()).equals(
          accumulatedRewards.toString()
        );

        const prevBalance = await xfit.balanceOf(users[0]);
        //Claim the rewards
        await impersonateAccount(users[0]);
        await xfai.withdrawLP(0, 0, { from: users[0] });

        // new reward is 366.66 + 33.33
        const postBalance = await xfit.balanceOf(users[0]);

        expect(postBalance.sub(prevBalance).toString()).equals("400");
      });
      it("Behaves correctly when staked LP tokens are withdrawn", async () => {
        const userStake = await xfai.userInfo(0, users[0]);
        const prevXFitBalance = await xfit.balanceOf(users[0]);
        const prevLpBalance = await usdtXFitPairContract.methods
          .balanceOf(xfai.address)
          .call();
        // console.log(userStake.amount.div(new BN(2)).toString());
        for (let i = 0; i < 10; i++) {
          await mineBlocks();
        }
        // total rewards puto this point = 333.4
        await impersonateAccount(users[0]);
        await xfai.withdrawLP(0, userStake.amount.div(new BN(2)).toString(), {
          from: users[0],
        });
        const postXFitBalance = await xfit.balanceOf(users[0]);
        const postLpBalance = await usdtXFitPairContract.methods
          .balanceOf(xfai.address)
          .call();
        expect(postXFitBalance.sub(prevXFitBalance).toString()).equals("367");
        expect((prevLpBalance - postLpBalance).toString()).equals(
          userStake.amount.div(new BN(2)).toString()
        );

        await mineBlocks();
        await mineBlocks();

        const accumulatedRewards = await xfai.pendingXFIT(0, users[0]);
        expect(accumulatedRewards.toString()).equals("40");
      });

      it("Behaves correctly when staked LP tokens are withdrawn using withdrawLPWithToken", async () => {
        const userStake = await xfai.userInfo(0, users[0]);
        const prevXFitBalance = await xfit.balanceOf(users[0]);
        const prevLpBalance = await usdtXFitPairContract.methods
          .balanceOf(xfai.address)
          .call();

        const lpTotalSupply = await usdtXFitPairContract.methods
          .totalSupply()
          .call();
        const reserves = await usdtXFitPairContract.methods
          .getReserves()
          .call();
        const token0 = await usdtXFitPairContract.methods.token0().call();

        let xFitReserves =
          xfit.address == token0 ? reserves._reserve0 : reserves._reserve1;

        const xfitValue = new BN(userStake.amount.toString())
          .mul(new BN(xFitReserves))
          .div(new BN(lpTotalSupply));

        await impersonateAccount(users[0]);
        await xfai.withdrawLPWithToken(0, userStake.amount.toString(), {
          from: users[0],
        });
        const postXFitBalance = await xfit.balanceOf(users[0]);
        const postLpBalance = await usdtXFitPairContract.methods
          .balanceOf(xfai.address)
          .call();
        expect(postXFitBalance.sub(prevXFitBalance).toString()).equals(
          (Number(xfitValue) + 60).toString() // 60 are the accumulated rewards
        );
        expect((prevLpBalance - postLpBalance).toString()).equals(
          userStake.amount.toString()
        );

        await mineBlocks();
        await mineBlocks();

        const accumulatedRewards = await xfai.pendingXFIT(0, users[0]);
        expect(accumulatedRewards.toString()).equals("0");
      });
    });
    describe("when contract does not have XFit equal to xFitThreeshold", async () => {
      it("uses Uniswap to swap input tokens for XFit", async () => {
        await xfai.withdrawAdminXFIT("99000000000000000000000");
        const availableXFit = await xfit.balanceOf(xfai.address);
        const xFitThreeshold = await xfai.xFitThreeshold();
        expect(availableXFit.lt(xFitThreeshold)).to.be.true;

        await impersonateAccount(users[0]);

        await usdt.approve(xfai.address, "100000000", { from: users[0] });
        const receipt = await xfai.depositLPWithToken(0, "100000000", 1, {
          from: users[0],
        });

        const reserves = await usdtXFitPairContract.methods
          .getReserves()
          .call();

        const token0 = await usdtXFitPairContract.methods.token0().call();
        let usdtReserves =
          usdt.address == token0 ? reserves._reserve0 : reserves._reserve1;

        // USE THIS FORMULA TO CALCULATE THE SWAPIN AMOUNT
        //     Babylonian
        //     .sqrt(
        //     reserveIn.mul(userIn.mul(3988000) + reserveIn.mul(3988009))
        // )
        //     .sub(reserveIn.mul(1997)) / 1994;

        const number = new BN(usdtReserves).mul(
          new BN("100000000")
            .mul(new BN(3988000))
            .add(new BN(usdtReserves).mul(new BN(3988009)))
        );
        const numberA = Math.sqrt(Number(number.toString()));
        const numberB = new BN(usdtReserves).mul(new BN(1997)).toString();
        const expectedSwapAmount = new BN(numberA - Number(numberB)).div(
          new BN(1994)
        );

        await expectEvent(receipt.receipt, "SWAP_TOKENS", {
          sender: users[0],
          amount: expectedSwapAmount,
          fromToken: usdt.address,
          toToken: xfit.address,
        });
      });
    });
    describe("Dynamic Allocation Point", () => {
      it("In case of multiple pools, handles dynamic allocation points correctly", async () => {
        // start with clean slate
        const userInfo0 = await xfai.userInfo(0, users[0]);
        const userInfo1 = await xfai.userInfo(0, users[1]);
        const userInfo2 = await xfai.userInfo(0, users[2]);

        for (let i = 0; i < 10; i++) {
          await mineBlocks();
        }
        
        await impersonateAccount(users[0]);
        await xfai.withdrawLPWithToken(0, userInfo0.amount.toString(), {
          from: users[0],
        });

        await impersonateAccount(users[1]);
        await xfai.withdrawLPWithToken(0, userInfo1.amount.toString(), {
          from: users[1],
        });

        await impersonateAccount(users[2]);
        await xfai.withdrawLPWithToken(0, userInfo2.amount.toString(), {
          from: users[2],
        });

        await mineBlocks();

        await impersonateAccount(users[0]);
        await usdt.approve(xfai.address, "10000000", { from: users[0] });
        const receipt = await xfai.depositLPWithToken(0, "10000000", 1, {
          from: users[0],
        });

        await mineBlocks();
        await mineBlocks();
        // 100 + 100 = 200 total rewards

        await impersonateAccount(users[1]);
        await dai.approve(xfai.address, "10000000000000000000", {
          from: users[1],
        });
        const receiptDai = await xfai.depositLPWithToken(
          1,
          "10000000000000000000",
          1,
          {
            from: users[1],
          }
        );
        // 200 + 100 + 100 = 400 total rewards
        const poolInfo = [];
        poolInfo[0] = await xfai.poolInfo(0);
        poolInfo[1] = await xfai.poolInfo(1);
        const totalAllocPoint = await xfai.totalAllocPoint();
        const totalLiquidity = await xfai.totalLiquidity();
        const usdtLiquidity = await usdtXFitPairContract.methods
          .balanceOf(xfai.address)
          .call();
        const daiLiquidity = await daiXFitPairContract.methods
          .balanceOf(xfai.address)
          .call();

        const usdtRewardsShare = new BN(usdtLiquidity)
          .mul(new BN(1e6))
          .mul(new BN("1000000000000000000")) // to since the result is less than zero
          .div(totalLiquidity);

        const daiRewardsShare = new BN(daiLiquidity)
          .mul(new BN("1000000000000000000"))
          .div(totalLiquidity);

        await mineBlocks();
        await mineBlocks();

        const usdtRewardsForLast2Blocks = usdtRewardsShare
          .mul(new BN(100)) // totalBlockReward
          .mul(new BN(2))
          .div(new BN("1000000000000000000"));

        const daiRewardsForLast2Blocks = daiRewardsShare
          .mul(new BN(100)) // totalBlockReward
          .mul(new BN(2))
          .div(new BN("1000000000000000000"))
          .sub(new BN(1)); // Rounding error

        const expectedUSDTReward = new BN(400).add(usdtRewardsForLast2Blocks);

        const accumulatedUSDTRewards = await xfai.pendingXFIT(0, users[0]);

        const accumulatedDAIRewards = await xfai.pendingXFIT(1, users[1]);

        expect(expectedUSDTReward.toString()).to.be.equal(
          accumulatedUSDTRewards.toString()
        );
        expect(accumulatedDAIRewards.toString()).to.be.equal(
          daiRewardsForLast2Blocks.toString()
        );
      });
    });
  });
  describe("XPriceOracle", async () => {});
});
