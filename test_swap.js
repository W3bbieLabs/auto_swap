import { long, exit_long } from './web3_utils.js';
import { tokens } from './web3_utils.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from "@solana/spl-token";
import dotenv from "dotenv";
let { WALLET_PRIVATE_KEY_4GM } = process.env;

// Get and log the command line arguments
let symbol = "ai16z"
let wallet_address = "45QwnkQcoSFi8vEHFB1pKTGJ7JP1jvMGZ43xngq7n4gM"

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

console.log("begining test")
let result = await long(symbol, WALLET_PRIVATE_KEY_4GM, wallet_address)
console.log(result)
//sleep(10000)
let result2 = await exit_long(symbol, WALLET_PRIVATE_KEY_4GM, wallet_address, 9)
console.log(result2)

