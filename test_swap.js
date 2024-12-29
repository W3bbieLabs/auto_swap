import { long, exit_long } from './web3_utils.js';
let { WALLET_PRIVATE_KEY_SNV, WALLET_ADDRESS_SNV } = process.env;

// Get and log the command line arguments
let symbol = "swarm"

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

// console.log("begining test")
// let result = await long(symbol, WALLET_PRIVATE_KEY_SNV, WALLET_ADDRESS_SNV)
// console.log(result)
// await sleep(20000)
// let result2 = await exit_long(symbol, WALLET_PRIVATE_KEY_SNV, WALLET_ADDRESS_SNV)
// console.log(result2)

