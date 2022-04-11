/* global artifacts */
require('dotenv').config({ path: '../.env' })
const fs = require('fs')
const ERC20Sacred = artifacts.require('ERC20Sacred')
const Verifier = artifacts.require('Verifier')
const hasherContract = artifacts.require('Hasher')
const ERC20Mock = artifacts.require('ERC20Mock')
const config = require('../instanceConfig')
const { toWei } = require('web3-utils')
let addresses = require('../config.json')


module.exports = function(deployer, network, accounts) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, OPERATOR_FEE, LENDING_POOL_ADDRESS_PROVIDER } = process.env
    console.log("Network: ", network)

    const verifier = await Verifier.deployed()
    const hasherInstance = await hasherContract.deployed()
    const chainIdMap = {
      mainnet: 1,
      kovan: 42,
      rinkeby: 4,
      mumbai: 80001,
      polygon: 137
    }
    const netKey = "netId" + chainIdMap[network]
    if(!addresses.deployments) {
      addresses.deployments = {}
    }
    if(!addresses.deployments[netKey]) {
      addresses.deployments[netKey] = {}
    }
    for(var i = 0; i < config["erc20"].length; i++) {
      const token = config["erc20"][i];
      console.log("Deploying instances: ", token.name)
      const tokenAmounts = token.amounts;
      console.log("Token Address: ", token.token[network])
      console.log("AToken Address: ", token.aToken[network])
      if(!addresses.deployments[netKey][token.name]) {
        addresses.deployments[netKey][token.name] = {
          instanceAddress:{},
        }
      }
      for(var j = 0; j < tokenAmounts.length; j++) {
        console.log("Deploying ERC20Sacred instance: ", tokenAmounts[j])
        let amount = toWei(tokenAmounts[j]);
        await ERC20Sacred.link(hasherContract, hasherInstance.address)
        const sacred = await deployer.deploy(
          ERC20Sacred,
          verifier.address,
          amount,
          MERKLE_TREE_HEIGHT,
          LENDING_POOL_ADDRESS_PROVIDER,
          token.token[network],
          token.aToken[network],
          accounts[0],
          OPERATOR_FEE
        )
        addresses.deployments[netKey][token.name].instanceAddress[tokenAmounts[j]] = sacred.address
        addresses.deployments[netKey][token.name].symbol = token.symbol
        addresses.deployments[netKey][token.name].decimals = token.decimals
        addresses.deployments[netKey][token.name].tokenAddress = token.token[network]
      }
    }
    fs.writeFileSync('./config.json', JSON.stringify(addresses, null, '  '))
  })
}
