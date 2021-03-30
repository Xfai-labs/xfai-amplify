const { artifacts, assert, expect } = require("hardhat");
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
  let xPriceOracle;
  before(async () => {
    [admin, dev, ...users] = await web3.eth.getAccounts();
    await impersonateAccount(treasury);
    xfit = await XFit.at("0xc5e427321f9fe11bd2990127bfde89da666eb31b");
    await xfit.mint(treasury, "1000000000000000000000000000000", {
      from: treasury,
    });

    await impersonateAccount(admin);
    xfai = await XFai.new(
      xfit.address,
      dev, // Dev Address
      "100", // Drip rate
      24049846, // Reward start block
      24049850, // Bonus rewards end block
      "5000000000000000000000", // xFitThreeshold
      "500000000000000000", //FundsSplitFactor);
      { from: admin }
    );
    usdt = await XFit.at("0xcb346131339cc001a56d8178e28ec2a15254cd31");
    xPriceOracle = await XPriceOracle.new(
      USDT_XFIT_PAIR // Pair address
    );
    await xPriceOracle.update();
    await xfai.add(
      USDT_XFIT_PAIR, // Pair address
      usdt.address, // Input Token
      xPriceOracle.address,
      true
    );

    await impersonateAccount(treasury);
    await xfit.transfer(xfai.address, "100000000000000000000000", {
      from: treasury,
    });
    // Distribute USDT to users
    await usdt.transfer(users[0], "100000000", { from: treasury });
    await usdt.transfer(users[1], "100000000", { from: treasury });
    await usdt.transfer(users[2], "100000000", { from: treasury });
  });

  describe("Initial Setup", async () => {
    it("should return nonzero USDT tokens balance for treasury", async () => {
      const balance = await usdt.balanceOf(treasury);
      expect(new BN(balance).gt(new BN("0"))).to.be.true;
    });
    it("should return correct USDT tokens balance for users", async () => {
      const balance = await usdt.balanceOf(users[0]);
      expect(new BN(balance).eq(new BN("100000000"))).to.be.true;
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
        const expectedXFit = await xPriceOracle.consult(usdt.address, "500");
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
        const expectedXFit = await xPriceOracle.consult(usdt.address, "500");
        await usdt.approve(xfai.address, "1000", { from: users[0] });
        const receipt = await xfai.depositLPWithToken(0, "1000", 1, {
          from: users[0],
        });
        await expectEvent(receipt.receipt, "INTERNAL_SWAP", {
          sender: users[0],
          tokensBought: expectedXFit,
        });

        await impersonateAccount(users[1]);
        const expectedXFit2 = await xPriceOracle.consult(usdt.address, "500");
        await usdt.approve(xfai.address, "1000", { from: users[1] });
        const receipt2 = await xfai.depositLPWithToken(0, "1000", 1, {
          from: users[1],
        });
        await expectEvent(receipt2.receipt, "INTERNAL_SWAP", {
          sender: users[1],
          tokensBought: expectedXFit2,
        });

        await impersonateAccount(users[2]);
        const expectedXFit3 = await xPriceOracle.consult(usdt.address, "500");
        await usdt.approve(xfai.address, "1000", { from: users[2] });
        const receipt3 = await xfai.depositLPWithToken(0, "1000", 1, {
          from: users[2],
        });
        await expectEvent(receipt3.receipt, "INTERNAL_SWAP", {
          sender: users[2],
          tokensBought: expectedXFit3,
        });
      });
      it("Distributes rewards correctly", async () => {

      });
      describe("Handles pool weights and allocation points correctly", async () => {});
    });
  });
  describe("XPriceOracle", async () => {});
});
