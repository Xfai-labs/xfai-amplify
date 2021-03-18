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
      "0x0EC23E0d5Db74275Aa6B2A7bECec970A3636Db20",
      "500000000000000000",
      "5000000000000000000",
      23885245,
      23887111,
      "500000000000000000"
    );
    const xfai = await XFai.deployed();
    await xFit.transfer(xfai.address, "100000000000000000000000");
    await xfai.add(
      100,
      "0x64012fdcB2BC4aeB8072b54579742A5c81B24De7",
      "0xcb346131339cc001a56d8178e28ec2a15254cd31",
      xPriceOracle.address,
      true
    );
  });
};
