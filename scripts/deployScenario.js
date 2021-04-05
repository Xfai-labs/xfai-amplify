const { web3 } = require("hardhat");
const XFai = artifacts.require("XFai");
const Xfit = artifacts.require("Xfit");
const XPriceOracle = artifacts.require("XPriceOracle");

async function main() {
  // We get the contract to deploy
  const xfit = new web3.eth.Contract(Xfit.abi, "0xc5e427321f9fe11bd2990127bfde89da666eb31b");
  const xfitUsdtPriceOracle = new web3.eth.Contract(XPriceOracle)
  await xfitUsdtPriceOracle.deploy("0x64012fdcB2BC4aeB8072b54579742A5c81B24De7")
  await deployer.deploy(
    XPriceOracle,
    "0x64012fdcB2BC4aeB8072b54579742A5c81B24De7" // Pair address
  );
  await deployer.deploy(
    XPriceOracle,
    "0xd60620461e1A8652d2746f173789947293c8e6C3" // Pair address
  );
  await deployer.deploy(
    XFai,
    xFit.address,
    "0x77c940F10a7765B49273418aDF5750979718e85f", // Dev Address
    "50000000000000000", // Drip rate
    24144622, // Reward start block
    24154622, // Bonus rewards end block
    "50000000000000000000000", // xFitThreeshold
    "500000000000000000" //FundsSplitFactor
  );
  const xfai = await XFai.deployed();
  await xFit.transfer(xfai.address, "100000000000000000000000");
  await xfai.add(
    "0x64012fdcB2BC4aeB8072b54579742A5c81B24De7", // XFIT-USDT Pair address
    "0xcb346131339cc001a56d8178e28ec2a15254cd31", // USDT Token
    xPriceOracle.address,
    true
  );
  await xfai.add(
    "0xd60620461e1A8652d2746f173789947293c8e6C3", // XFIT-DAI Pair address
    "0x8b5DEB679F3242aEf2A43F199d539dF0Ba360625", // DAI Token
    xPriceOracle.address,
    true
  );

  const Xfit = await ethers("Greeter");
  const greeter = await Greeter.deploy("Hello, Hardhat!");

  console.log("Greeter deployed to:", greeter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
