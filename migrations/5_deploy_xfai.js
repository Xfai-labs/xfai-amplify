const XFai = artifacts.require("XFai");
const Xfit = artifacts.require("Xfit");
const XPriceOracle = artifacts.require("XPriceOracle");

module.exports = function (deployer) {
  deployer.then(async () => {
    const xFit = await Xfit.at("0xc5e427321f9fe11bd2990127bfde89da666eb31b");
  
    await deployer.deploy(
      XFai,
      xFit.address,
      "0x77c940F10a7765B49273418aDF5750979718e85f", // Dev Address
      "50000000000000000", // Drip rate
      24145017, // Reward start block
      24154622, // Bonus rewards end block
      "50000000000000000000000", // xFitThreeshold
      "500000000000000000" //FundsSplitFactor
    );
    const xfai = await XFai.deployed();
    await xFit.transfer(xfai.address, "10000000000000000000000");
    await xfai.add(
      "0x64012fdcB2BC4aeB8072b54579742A5c81B24De7", // XFIT-USDT Pair address
      "0xcb346131339cc001a56d8178e28ec2a15254cd31", // USDT Token
      "0xA1e3C4bD787828105fb26722891deDF98bd047Ac", //XPriceOracleUSDT
      true
    );
    await xfai.add(
      "0xd60620461e1A8652d2746f173789947293c8e6C3", // XFIT-DAI Pair address
      "0x8b5DEB679F3242aEf2A43F199d539dF0Ba360625", // DAI Token
      "0xEF5d3b95D1dD1ECe50c984bf3bD0834bb88710B0", //XPriceOracleDAI
      true
    );
  });
};
