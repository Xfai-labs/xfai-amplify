require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-web3");
require("hardhat-gas-reporter");

const fs = require("fs");

const privateKey = fs.readFileSync(".key").toString().trim();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.3",
      },
      {
        version: "0.6.2",
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-kovan.alchemyapi.io/v2/QRPubkmfXoGs0VlYyJe4QvFJK6-fW5H_`,
        blockNumber: 24163944,
      },
      allowUnlimitedContractSize: true,
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/QRPubkmfXoGs0VlYyJe4QvFJK6-fW5H_`,
      accounts: [privateKey],
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/QRPubkmfXoGs0VlYyJe4QvFJK6-fW5H_`,
      accounts: [privateKey],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "6SZADERRW7JUGQ6QCK9Z15YDIB1FW1ZIX9",
  },
  gasReporter: {
    gasPrice: 150
  }
};
