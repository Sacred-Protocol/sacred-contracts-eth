require("dotenv").config();
const { expect } = require('chai');
const { waffle } = require("hardhat");
const utils = require('../lib/utils')
const erc20Abi = require('../artifacts/contracts/ERC20Sacred.sol/ERC20Sacred.json')
const config = require('../config.json')

const withdrawCircuit = require('../build/circuits/withdraw.json')
const { RPC_URL } = process.env
const withdrawProvidingKeyFilePath = 'build/circuits/withdraw_proving_key.bin'
let owner;

describe('Test Sacred Contracts', () => {
  // Deploy and setup the contracts
  before(async () => {
    // get the signers
    const signers = await ethers.getSigners();
    owner = signers[0];
    await utils.init({instancesInfo:config, erc20Contract: erc20Abi.abi, rpc: RPC_URL})
  });

  describe('Test Deposit, Withdraw', () => {
    // we'll always need the user ETH balance to be greater than 3 ETH, because we use 2 ETH as the base amount for token conversions e.t.c
    it('Deposit/Withdraw', async () => {
      let ethbalance = Number(ethers.utils.formatEther(await owner.getBalance()));
      console.log('User ETH balance is ', ethbalance);

      const currency = "eth"
      const amount = 0.1
      await utils.setup({
        ethSacredAbiPath:"../artifacts/contracts/ETHSacred.sol", 
        erc20SacredAbiPath:"../artifacts/contracts/ERC20Sacred.sol", 
        withdrawCircuit, 
        withdrawProvidingKeyFilePath
      });
      const { noteString, } = await utils.deposit({currency, amount});
      const { netId, deposit } = utils.baseUtils.parseNote(noteString)
      expect(""+netId).to.equal(utils.getNetId())
      const refund = '0'
      await utils.withdraw({deposit, currency, amount, recipient: owner.address, refund });

      ethbalance = Number(ethers.utils.formatEther(await owner.getBalance()));
      console.log('User ETH balance is ', ethbalance);
    });
    
    
  //   let noteStrings = []
  //   it('Deposit', async () => {
  //     let ethbalance = Number(ethers.utils.formatEther(await owner.getBalance()));
  //     console.log('User ETH balance is ', ethbalance);
  //     for(let i = 0; i < 10; i++) {
  //       const noteString = await test.deposit({currency:'eth', amount:2});
  //       noteStrings.push(noteString)
  //     }
  //     ethbalance = Number(ethers.utils.formatEther(await owner.getBalance()));
  //     console.log('User ETH balance is ', ethbalance);
  //   });

  //   it('Withdraw', async () => {
  //     for(let i = 0; i < 10; i++) {
  //       let data = test.parseNote(noteStrings[i]);
  //       await test.withdraw({ deposit: data.deposit, currency: data.currency, amount:data.amount, recipient: owner.address, relayerURL: null });
  //     }
  //     let ethbalance = Number(ethers.utils.formatEther(await owner.getBalance()));
  //     console.log('User ETH balance is ', ethbalance);
  // });

  });

});