const XPriceOracle = artifacts.require("XPriceOracle");

module.exports = function (deployer) {
  deployer.then(async () => {
    // Pass the pair address to oracle contract
    await deployer.deploy(
      XPriceOracle,
      "0x64012fdcB2BC4aeB8072b54579742A5c81B24De7"  // Pair address
    );
  });
};
