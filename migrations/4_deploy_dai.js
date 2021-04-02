const DAI = artifacts.require("MockErc20");
const Web3 = require("web3");

module.exports = function (deployer) {
  deployer.then(async () => {
    const dai = await deployer.deploy(
      DAI,
      Web3.utils.toBN("100000000000000000000000"),
      18,
      "DAI",
      "DAI"
    );
  });
};
