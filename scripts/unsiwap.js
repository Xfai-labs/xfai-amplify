const { ChainId, Fetcher } = require("@uniswap/sdk");

const chainId = ChainId.KOVAN;
const usdt = "0xcb346131339cc001a56d8178e28ec2a15254cd31"; // must be checksummed
const xfit = "0xc5e427321f9fe11bd2990127bfde89da666eb31b"; // must be checksummed

async function initTokens() {
  const USDT = await Fetcher.fetchTokenData(chainId, usdt);
  const XFIT = await Fetcher.fetchTokenData(chainId, xfit);
  const pair = await Fetcher.fetchPairData(USDT, XFIT);
  console.log(pair.liquidityToken.address);
}

initTokens();
