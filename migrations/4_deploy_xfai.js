const XFai = artifacts.require("XFai");
const Xfit = artifacts.require("Xfit");
const XPriceOracle = artifacts.require("XPriceOracle");

module.exports = function (deployer) {
  deployer.then(async () => {
    const xFit = await Xfit.deployed();
    const xPriceOracle = await XPriceOracle.deployed();
    await deployer.deploy(
      XFai,
      xFit.address,
      "0x77c940F10a7765B49273418aDF5750979718e85f", // Dev Address
      "50000000000000000", // Drip rate
      23885245, // Reward start block
      23887111, // Bonus rewards end block
      "5000000000000000000000", // xFitThreeshold
      "500000000000000000" //FundsSplitFactor
    );
    const xfai = await XFai.deployed();
    await xFit.transfer(xfai.address, "100000000000000000000000");
    await xfai.add(
      "0x64012fdcB2BC4aeB8072b54579742A5c81B24De7", // Pair address
      "0xcb346131339cc001a56d8178e28ec2a15254cd31", // Input Token
      xPriceOracle.address,
      true
    );
  });
};
