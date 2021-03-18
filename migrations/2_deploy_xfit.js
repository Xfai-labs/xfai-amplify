const Xfit = artifacts.require("Xfit");

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(Xfit, "XFitToken", "xfit");


    const xFit = await Xfit.deployed();
    await xFit.mint("0x0EC23E0d5Db74275Aa6B2A7bECec970A3636Db20", "1000000000000000000000000000000");
  });
};
