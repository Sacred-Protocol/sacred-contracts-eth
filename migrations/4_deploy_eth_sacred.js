/* global artifacts */
require('dotenv').config({ path: '../.env' })
const fs = require('fs')
const ETHSacred = artifacts.require('ETHSacred')
const Verifier = artifacts.require('Verifier')
const hasherContract = artifacts.require('Hasher')
const config = require('../instanceConfig')
const { toWei } = require('web3-utils')
let addresses = require('../config.json')

module.exports = function(deployer, network, accounts) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, OPERATOR_FEE, LENDING_POOL_ADDRESS_PROVIDER, WETH_GATEWAY, WETH_TOKEN } = process.env
    const ethAmounts = config.eth.amounts;
    const verifier = await Verifier.deployed()
    const hasherInstance = await hasherContract.deployed()
    const chainIdMap = {
      mainnet: 1,
      kovan: 42,
      rinkeby: 4,
      mumbai: 80001,
      polygon: 137
    }
    console.log("Network: ", network)
    console.log("AToken Address: ", config.eth.aToken[network])
    const netKey = "netId" + chainIdMap[network]
    if(!addresses.deployments) {
      addresses.deployments = {}
    }
    if(!addresses.deployments[netKey]) {
      addresses.deployments[netKey] = {
        eth: {
          instanceAddress:{},
        }
      }
    }
    for(var i = 0; i < ethAmounts.length; i++) {
      console.log("Deploying ETHSacred instance: ", ethAmounts[i])
      let amount = toWei(ethAmounts[i]);
      await ETHSacred.link(hasherContract, hasherInstance.address)
      const sacred = await deployer.deploy(
        ETHSacred, 
        verifier.address, 
        amount, 
        MERKLE_TREE_HEIGHT, 
        LENDING_POOL_ADDRESS_PROVIDER,
        WETH_GATEWAY,
        config.eth.aToken[network],
        accounts[0], 
        OPERATOR_FEE)

      addresses.deployments[netKey].eth.instanceAddress[ethAmounts[i]] = sacred.address
      addresses.deployments[netKey].eth.symbol = config.eth.symbol
      addresses.deployments[netKey].eth.decimals = config.eth.decimals
    }
    fs.writeFileSync('./config.json', JSON.stringify(addresses, null, '  '))
  })
}