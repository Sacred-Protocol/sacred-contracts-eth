require('dotenv').config()
const { ethers } = require('hardhat')
const utils = require('../utils')
const { MERKLE_TREE_HEIGHT, ETH_AMOUNTS, OPERATOR_FEE, LENDING_POOL_ADDRESS_PROVIDER, WETH_GATEWAY, WETH_TOKEN } = process.env

async function main() {

  const provider = await utils.getProvider(rpc)
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)  

  const Verifier = await ethers.getContractFactory('Verifier');
  const Hasher = await ethers.getContractFactory('Hasher');
  //Deploy Hasher Contract
  const hasher = await (await Hasher.deploy()).deployed();

  const ETHSacred = await ethers.getContractFactory(
    "ETHSacred",
    {
      libraries: {
        Hasher: hasher.address
      }
    }
  );

  //Deploy Verifier Contract
  const verifier = await (await Verifier.deploy()).deployed();

  //Deploy SacredInstances(ETH)
  const ethAmounts = ETH_AMOUNTS.split(",");
  let addresses = []
  for(var i = 0; i < ethAmounts.length; i++) {
    let amount = ethAmounts[i];
    console.log("Deploying ETHSacred instance: ", amount)
    const sacred = await (await ETHSacred
      .deploy(verifier.address, amount, MERKLE_TREE_HEIGHT, LENDING_POOL_ADDRESS_PROVIDER, WETH_GATEWAY, WETH_TOKEN, wallet.address, OPERATOR_FEE))
      .deployed();
    addresses[i] = sacred.address
  }

  for(var i = 0; i < ethAmounts.length; i++) {
    let amount = ethAmounts[i];
    console.log('' + amount + ' - ETHSacred\'s address ', addresses[i])
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })