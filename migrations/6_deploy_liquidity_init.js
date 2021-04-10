const LiquidityInitialiser = artifacts.require("LiquidityInitialiser");

module.exports = function (deployer) {
  deployer.then(async () => {
    const dai = await deployer.deploy(
      LiquidityInitialiser,
      "0x69D9801FD1f4F061C8BAA0561dE8bAbA37d1D222",
      3600
    );
  });
};
