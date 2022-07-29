// Generates Hasher artifact at compile-time using Truffle's external compiler
// mechanism
const path = require('path')
const fs = require('fs')
const genContract = require('circomlib/src/poseidon_gencontract.js')

// where Truffle will expect to find the results of the external compiler
// command
const outputPath = path.join(__dirname, 'artifacts/contracts/MerkleTreeWithHistory.sol', 'Hasher.json')

function main () {
  const data = fs.readFileSync(outputPath)
  let contract = JSON.parse(data);
  contract.bytecode = genContract.createCode('mimcsponge', 220);
  // const contract = {
  //   contractName: 'Hasher',
  //   abi: genContract.abi,
  //   bytecode: genContract.createCode('mimcsponge', 220)
  // }

  fs.writeFileSync(outputPath, JSON.stringify(contract))
}

main()
