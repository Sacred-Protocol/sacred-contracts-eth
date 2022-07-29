require('dotenv').config()
const baseUtils = require("./baseUtils")
const path = require('path')
const axios = require('axios')
const { getCreate2Address } = require('@ethersproject/address')
const { keccak256 } = require('@ethersproject/solidity')
const { ethers } = require("hardhat");
const MerkleTree = require('fixed-merkle-tree')
const fs = require('fs')
const snarkjs = require('snarkjs')
const bigInt = snarkjs.bigInt
const buildGroth16 = require('websnark/src/groth16')
const websnarkUtils = require('websnark/src/utils')
const { fromWei, toWei, toBN, BN } = require('web3-utils')

const { PRIVATE_KEY } = process.env
let web3, circuit, proving_key, groth16
let sacredProxy, sacredInstance
let MERKLE_TREE_HEIGHT
let netId, config, wallet
let erc20Abi

async function init({ instancesInfo, erc20Contract, rpc}) {
  baseUtils.init(rpc)
  const { chainId } = await baseUtils.provider.getNetwork()
  netId = chainId
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    const accounts = await ethers.getSigners();
    wallet = accounts[0];
  } else {
    wallet = new ethers.Wallet(PRIVATE_KEY, baseUtils.provider)
  }

  config = instancesInfo
  erc20Abi = erc20Contract
}

async function setup ({sacredInstanceContract, sacredProxyContract, withdrawCircuit, withdrawProvidingKeyFilePath}) {
  circuit = withdrawCircuit
  proving_key = fs.readFileSync(withdrawProvidingKeyFilePath).buffer
  MERKLE_TREE_HEIGHT = process.env.MERKLE_TREE_HEIGHT || 20
  groth16 = await buildGroth16()
  sacredProxy = sacredProxyContract
  sacredInstance = sacredInstanceContract
}

/** Display ETH account balance */
async function printETHBalance({ address, name }) {
  console.log(`${name} ETH balance is`, ethers.utils.formatEther(await baseUtils.provider.getBalance(address)))
}

/** Display ERC20 account balance */
async function printERC20Balance({ address, name, tokenAddress }) {
  const erc20 = new ethers.Contract(tokenAddress, erc20Abi, wallet)
  console.log(`${name} Token Balance is`, ethers.utils.formatEther(await erc20.balanceOf(address)))
}

/**
 * Generate merkle tree for a deposit.
 * Download deposit events from the sacred, reconstructs merkle tree, finds our deposit leaf
 * in it and generates merkle proof
 * @param deposit Deposit object
 */
 async function generateMerkleProof(deposit) {
  // Get all deposit events from smart contract and assemble merkle tree from them
  console.log('Getting current state from sacred contract')
  const events = await baseUtils.getEvents(sacredInstance, {eventName:"Deposit", fromBlock: 0, toBlock: 'latest' })
  const leaves = events
    .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex) // Sort events in chronological order
    .map(e => e.returnValues.commitment)
  const tree = new MerkleTree(MERKLE_TREE_HEIGHT, leaves, { hashFunction: baseUtils.poseidonHash2 })

  // Find current commitment in the tree
  const depositEvent = events.find(e => e.returnValues.commitment === baseUtils.toHex(deposit.commitment))
  const leafIndex = depositEvent ? depositEvent.returnValues.leafIndex : -1
  // Compute merkle proof of our commitment
  const path = tree.path(leafIndex) 
  return {
    root: tree.root(),
    path_elements: path.pathElements,
    path_index: baseUtils.bitsToNumber(path.pathIndices)
  }
}

/**
 * Generate SNARK proof for withdrawal
 * @param deposit Deposit object
 * @param recipient Funds recipient
 * @param relayer Relayer address
 * @param fee Relayer fee
 * @param refund Receive ether for exchanged tokens
 */
 async function generateProof({ deposit, recipient, relayerAddress = 0, fee = 0, refund = 0 }) {
  // Compute merkle proof of our commitment
  const { root, path_elements, path_index } = await generateMerkleProof(deposit)

  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: toBN(recipient),
    relayer: toBN(relayerAddress),
    fee: fee,
    refund: refund,

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: path_elements,
    pathIndices: path_index,
  }

  console.log('Generating SNARK proof')
  console.time('Proof time')
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
  const { proof } = websnarkUtils.toSolidityInput(proofData)
  console.timeEnd('Proof time')

  const args = [
    baseUtils.toHex(input.root),
    baseUtils.toHex(input.nullifierHash),
    baseUtils.toHex(input.recipient, 20),
    baseUtils.toHex(input.relayer, 20),
    baseUtils.toHex(input.fee),
    baseUtils.toHex(input.refund)
  ]

  return { proof, args }
}

/**
 * Make a deposit
 * @param currency Сurrency
 * @param amount Deposit amount
 */
async function deposit({ currency, amount }) {
  const deposit = baseUtils.createDeposit({ nullifier: rbigint(31), secret: rbigint(31) })
  const note = baseUtils.toHex(deposit.preimage, 62)
  const noteString = `sacred-${currency}-${amount}-${netId}-${note}`
  console.log(`Your note: ${noteString}`)
  let blockNumber = 0
  if (currency === 'eth') {
    const value = ethers.utils.parseEther(amount.toString())
    await printETHBalance({ address: sacred.address, name: 'Sacred' })
    await printETHBalance({ address: senderAccount, name: 'Sender account' })
    console.log('Submitting deposit transaction')
    console.log(value.toString())
    let overrides = { value, from: senderAccount, gasLimit: 20000000 }
    if(sacredProxy) {
      const instance = getSacredInstanceAddress(netId, currency, amount)
      const tx = await (await sacredProxy.deposit(instance, baseUtils.toHex(deposit.commitment), note, overrides)).wait()
      blockNumber = tx.blockNumber  
    } else {
      const tx = await (await sacredInstance.deposit(baseUtils.toHex(deposit.commitment), note, overrides)).wait()
      blockNumber = tx.blockNumber
    }

    await printETHBalance({ address: sacred.address, name: 'Sacred' })
    await printETHBalance({ address: senderAccount, name: 'Sender account' })
  } else { // a token
    // await printERC20Balance({ address: sacred.address, name: 'Sacred' })
    // await printERC20Balance({ address: senderAccount, name: 'Sender account' })
    // const decimals = isLocalRPC ? 18 : config.deployments[`netId${netId}`][currency].decimals
    // const tokenAmount = isLocalRPC ? TOKEN_AMOUNT : fromDecimals({ amount, decimals })
    // if (isLocalRPC) {
    //   console.log('Minting some test tokens to deposit')
    //   await erc20.methods.mint(senderAccount, tokenAmount).send({ from: senderAccount, gas: 2e6 })
    // }

    // const allowance = await erc20.methods.allowance(senderAccount, sacred.address).call({ from: senderAccount })
    // console.log('Current allowance is', fromWei(allowance))
    // if (toBN(allowance).lt(toBN(tokenAmount))) {
    //   console.log('Approving tokens for deposit')
    //   await erc20.methods.approve(sacred.address, tokenAmount).send({ from: senderAccount, gas: 1e6 })
    // }

    // console.log('Submitting deposit transaction')
    // await sacred.methods.deposit(toHex(deposit.commitment)).send({ from: senderAccount, gas: 2e6 })
    // await printERC20Balance({ address: sacred.address, name: 'Sacred' })
    // await printERC20Balance({ address: senderAccount, name: 'Sender account' })
  }

  return {
    noteString,
    blockNumber
  }
}

/**
 * Do an ETH withdrawal
 * @param noteString Note to withdraw
 * @param recipient Recipient address
 */
 async function withdraw({ deposit, currency, amount, recipient, relayerURL, refund = '0' }) {
  if (currency === 'eth' && refund !== '0') {
    throw new Error('The ETH purchase is supposted to be 0 for ETH withdrawals')
  }
  refund = toWei(refund)
  if (relayerURL) {
    if (relayerURL.endsWith('.eth')) {
      throw new Error('ENS name resolving is not supported. Please provide DNS name of the relayer. See instuctions in README.md')
    }
    const relayerStatus = await axios.get(relayerURL + '/status')
    const { relayerAddress, netId, gasPrices, ethPrices, relayerServiceFee } = relayerStatus.data
    assert(netId === await web3.eth.net.getId() || netId === '*', 'This relay is for different network')
    console.log('Relay address: ', relayerAddress)

    const decimals = isLocalRPC ? 18 : config.deployments[`netId${netId}`][currency].decimals
    const fee = calculateFee({ gasPrices, currency, amount, refund, ethPrices, relayerServiceFee, decimals })
    if (fee.gt(fromDecimals({ amount, decimals }))) {
      throw new Error('Too high refund')
    }
    const { proof, args } = await generateProof({ deposit, recipient, relayerAddress, fee, refund })

    console.log('Sending withdraw transaction through relay')
    try {
      const relay = await axios.post(relayerURL + '/relay', { contract: sacred._address, proof, args })
      if (netId === 1 || netId === 42) {
        console.log(`Transaction submitted through the relay. View transaction on etherscan https://${getCurrentNetworkName()}etherscan.io/tx/${relay.data.txHash}`)
      } else {
        console.log(`Transaction submitted through the relay. The transaction hash is ${relay.data.txHash}`)
      }

      const receipt = await waitForTxReceipt({ txHash: relay.data.txHash })
      console.log('Transaction mined in block', receipt.blockNumber)
    } catch (e) {
      if (e.response) {
        console.error(e.response.data.error)
      } else {
        console.error(e.message)
      }
    }
  } else {
    const { proof, args } = await generateProof({ deposit, recipient, refund })

    console.log('Submitting withdraw transaction')
    let tx
    if(sacredProxy) {
      const instance = getSacredInstanceAddress(netId, currency, amount)
      tx = await (await sacredProxy.withdraw(instance, proof, ...args, { from: senderAccount, value: refund.toString(), gasLimit: 20000000})).wait()
    } else {
      tx = await (await sacredInstance.withdraw(proof, ...args, { from: senderAccount, value: refund.toString(), gasLimit: 20000000})).wait()
    }
    
    // if(tx.status === 1) {
    //   if (netId === 1 || netId === 42) {
    //     console.log(`View transaction on etherscan https://${getCurrentNetworkName()}etherscan.io/tx/${txHash}`)
    //   } else {
    //     console.log(`The transaction hash is ${txHash}`)
    //   }
    // } else {
    //   console.error('on transactionHash error', tx.message)
    // }
  }
  console.log('Done')
  return tx.blockNumber
}


/** Recursive function to fetch past events, if it gives error for more than 100000 logs, it divides and conquer */
async function getPastEvents(start, end, data) {
  // console.log('start', start);
  try {
    const a = await sacred.getPastEvents('Deposit', { fromBlock: start, toBlock: end });
    data.push(a);
    return a;
  } catch (error) {
    const middle = Math.round((start + end) / 2);
    console.log('Infura 10000 limit [' + start + '..' + end + '] ' +
      '->  [' + start + '..' + middle + '] ' +
      'and [' + (middle + 1) + '..' + end + ']');
    await getPastEvents(start, middle, data);
    await getPastEvents(middle, end, data);
    let final = [];
    data?.forEach((d) => {
      final = final.concat(d);
    })
    return final;
  }
}

async function loadDepositData({ deposit }) {
  try {
    const eventWhenHappened = await sacred.getPastEvents('Deposit', {
      filter: {
        commitment: deposit.commitmentHex
      },
      fromBlock: 0,
      toBlock: 'latest'
    })
    if (eventWhenHappened.length === 0) {
      throw new Error('There is no related deposit, the note is invalid')
    }

    const { timestamp } = eventWhenHappened[0].returnValues
    const txHash = eventWhenHappened[0].transactionHash
    const isSpent = await sacred.isSpent(deposit.nullifierHex).call()
    const receipt = await web3.eth.getTransactionReceipt(txHash)

    return { timestamp, txHash, isSpent, from: receipt.from, commitment: deposit.commitmentHex }
  } catch (e) {
    console.error('loadDepositData', e)
  }
  return {}
}


async function loadWithdrawalData({ amount, currency, deposit }) {
  try {
    const events = await await sacred.getPastEvents('Withdrawal', {
      fromBlock: 0,
      toBlock: 'latest'
    })

    const withdrawEvent = events.filter((event) => {
      return event.returnValues.nullifierHash === deposit.nullifierHex
    })[0]

    const fee = withdrawEvent.returnValues.fee
    const decimals = config.deployments[`netId${netId}`][currency].decimals
    const withdrawalAmount = toBN(fromDecimals({ amount, decimals })).sub(
      toBN(fee)
    )
    const { timestamp } = await web3.eth.getBlock(withdrawEvent.blockHash)
    return {
      amount: toDecimals(withdrawalAmount, decimals, 9),
      txHash: withdrawEvent.transactionHash,
      to: withdrawEvent.returnValues.to,
      timestamp,
      nullifier: deposit.nullifierHex,
      fee: toDecimals(fee, decimals, 9)
    }
  } catch (e) {
    console.error('loadWithdrawalData', e)
  }
}

/**
 * Waits for transaction to be mined
 * @param txHash Hash of transaction
 * @param attempts
 * @param delay
 */
 function waitForTxReceipt({ txHash, attempts = 60, delay = 1000 }) {
  return new Promise((resolve, reject) => {
    const checkForTx = async (txHash, retryAttempt = 0) => {
      const result = await web3.eth.getTransactionReceipt(txHash)
      if (!result || !result.blockNumber) {
        if (retryAttempt <= attempts) {
          setTimeout(() => checkForTx(txHash, retryAttempt + 1), delay)
        } else {
          reject(new Error('tx was not mined'))
        }
      } else {
        resolve(result)
      }
    }
    checkForTx(txHash)
  })
}

function getSacredInstanceAddress(netId, currency, amount) {
  return config.deployments["netId" + netId][currency].instanceAddress['' + amount]
}

module.exports = {
  getSacredInstanceAddress,
  deposit,
  withdraw, 
  init,
  netId,
  wallet,
  printETHBalance,
  printERC20Balance,
  loadDepositData,
  baseUtils,
}
