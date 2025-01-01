import { long, exit_long } from './web3_utils.js';
let {
    WALLET_PRIVATE_KEY_4GM,
    WALLET_ADDRESS_4GM,
    WALLET_PRIVATE_KEY_SNV,
    WALLET_ADDRESS_SNV,
    WALLET_PRIVATE_KEY_TRAV_EJF,
    WALLET_ADDRESS_TRAV_EJF,
    WALLETT_PRIVATE_KEY_YB3,
    WALLET_ADDRESS_YB3,
    WALLET_PRIVATE_KEY_DDC,
    WALLET_ADDRESS_DDC
} = process.env;

// Get and log the command line arguments
let symbol = "swarm"

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

let private_key = WALLET_PRIVATE_KEY_SNV
let address = WALLET_ADDRESS_SNV

console.log("begining test")
let result = await long(symbol, private_key, address)
console.log(result)
await sleep(30000)
let result2 = await exit_long(symbol, private_key, address)
console.log(result2)

