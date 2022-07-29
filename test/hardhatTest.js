require("dotenv").config();
const test = require('./clitest');
const { expect } = require('chai');
const { waffle } = require("hardhat");

describe('Test Deposit, Withdraw', () => {
  let owner;
  let operator;
  let contractAddress;
  let sacred;
  // Deploy and setup the contracts
  before(async () => {
    const { MERKLE_TREE_HEIGHT, ETH_AMOUNT, LENDING_POOL_ADDRESS_PROVIDER, WETH_GATEWAY, WETH_TOKEN } = process.env

    // get the signers
    const signers = await ethers.getSigners();
    owner = signers[0];
    operator = signers[1];
    const Verifier = await ethers.getContractFactory('Verifier');
    const Hasher = await ethers.getContractFactory('Hasher');
    const hasher = await (await Hasher.deploy()).deployed();

    const ETHSacred = await ethers.getContractFactory(
      "ETHSacred",
      {
        libraries: {
          Hasher: hasher.address
        }
      }
    );

    const verifier = await (await Verifier.deploy()).deployed();
    sacred = await (await ETHSacred
      .deploy(verifier.address, ETH_AMOUNT, MERKLE_TREE_HEIGHT, LENDING_POOL_ADDRESS_PROVIDER, WETH_GATEWAY, WETH_TOKEN, operator.address, 50))
      .deployed();
    contractAddress = sacred.address
    console.log('ETHSacred\'s address ', sacred.address)

    await test.init({sender: owner.address, contractObj: sacred});
  });

  describe('Test Deposit, Withdraw', () => {
    // we'll always need the user ETH balance to be greater than 3 ETH, because we use 2 ETH as the base amount for token conversions e.t.c
    it('Deposit/Withdraw', async () => {
      let ethbalance = Number(ethers.utils.formatEther(await owner.getBalance()));
      console.log('User ETH balance is ', ethbalance);

      ethbalance = Number(ethers.utils.formatEther(await operator.getBalance()));
      console.log('Operator ETH balance is ', ethbalance);
      for(let i = 0; i < 1; i++) {
        const noteString = await test.deposit({currency:'eth', amount:0.1});
        let data = test.parseNote(noteString);
        await test.withdraw({ deposit: data.deposit, currency: data.currency, amount:data.amount, recipient: owner.address, relayerURL: null });
      }
      ethbalance = Number(ethers.utils.formatEther(await owner.getBalance()));
      console.log('User ETH balance is ', ethbalance);

      ethbalance = Number(ethers.utils.formatEther(await operator.getBalance()));
      console.log('Operator ETH balance is ', ethbalance);
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