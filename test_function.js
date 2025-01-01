import dotenv from "dotenv";
import { Connection, Keypair, VersionedTransaction, PublicKey, ComputeBudgetProgram } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import { getMint } from "@solana/spl-token";

const connection = new Connection('https://api.mainnet-beta.solana.com');

export let tokens = {
    'usdc': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'sol': 'So11111111111111111111111111111111111111112',
    'pengu': '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv',
    'bonk': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    'jup': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    'choose': 'G3q2zUkuxDCXMnhdBPujjPHPw9UTMDbXqzcc2UHM3jiy',
    'ai16z': 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
    'swarm': 'Hjw6bEcHtbHGpQr8onG3izfJY5DJiWdt7uk2BfdSpump',
    'binary': '23ENcgMStoFMYYj5qdauaca3v1ouvRdZXTdi55J1pump',
    'pythia': 'CreiuhfwdWCN5mJbMJtA9bBpYQrQF2tCBuZwSPWfpump',
    'scout': 'GLPdQwGtjcynj3RLraenPeR9v1REnpdyuciPBpVipump'
}

dotenv.config();

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


// Function to swap SOL to another token
async function swapSolToToken(
    privateKey,
    outputMint, // The destination token's mint address
    inputAmount, // Amount in lamports (1 SOL = 1_000_000_000 lamports)
    slippageBps = 50 // Default 0.5% slippage
) {
    // console.log("privateKey: ", privateKey)
    // console.log("outputMint: ", outputMint)
    // console.log("inputAmount: ", inputAmount)
    // console.log("slippageBps: ", slippageBps)
    try {
        // 1. Setup connection and wallet

        //const connection = new Connection('https://api.mainnet-beta.solana.com');
        const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(privateKey)));

        // 2. Get quote
        const quoteResponse = await (
            await fetch(`https://quote-api.jup.ag/v6/quote?` +
                `inputMint=So11111111111111111111111111111111111111112` + // SOL mint
                `&outputMint=${outputMint}` +
                `&amount=${inputAmount}` +
                `&slippageBps=${slippageBps}`
            )
        ).json();
        //console.log("quoteResponse: ")
        //console.log(quoteResponse)

        // 3. Get swap transaction
        const { swapTransaction } = await (
            await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    // Optional: Use dynamic slippage for better execution
                    // Add priority fee settings here
                    computeUnitPriceMicroLamports: 50000,
                    dynamicSlippage: { maxBps: slippageBps }
                })
            })
        ).json();

        // 4. Deserialize and sign the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');

        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        transaction.sign([wallet.payer]);

        // 5. Execute the transaction
        // get the latest block hash
        const latestBlockHash = await connection.getLatestBlockhash();

        // Execute the transaction
        const rawTransaction = transaction.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
            maxRetries: 2,
        });

        /*
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txid
        }, 'confirmed');
        */


        //console.log(`https://solscan.io/tx/${txid}`);

        return {
            success: true,
            tx: `https://solscan.io/tx/${txid}`,
            message: 'Swap transaction successful'
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}


// Function to get balance of any SPL token for a wallet
async function getTokenBalance(walletAddress, tokenMint) {
    try {
        ///const connection = new Connection('https://api.mainnet-beta.solana.com');
        const publicKey = new PublicKey(walletAddress);
        const tokenMintPubkey = new PublicKey(tokenMint);

        // Get all token accounts for this wallet
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: tokenMintPubkey
        });

        // If no token accounts found, return 0 balance
        if (tokenAccounts.value.length === 0) {
            return {
                success: true,
                balance: 0,
                decimals: 0
            };
        }

        // Get balance from the first token account
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        return {
            success: true,
            balance: Math.floor(balance),
        };

    } catch (error) {
        console.log(error);
        return {
            success: false,
            error: error.message
        };
    }
}


// Helper function to convert USDC to its smallest unit (6 decimals)
function tokenToSmallestUnit(usdc, decimals = 6) {
    return Math.round(usdc * Math.pow(10, decimals));
}

// Function to swap a token to SOL
async function swapTokenToSol(
    privateKey,
    inputMint, // The source token's mint address
    inputAmount, // Amount in token's smallest units (e.g., USDC has 6 decimals)
    slippageBps = 50 // Default 0.5% slippage
) {
    try {
        // 1. Setup connection and wallet
        //const connection = new Connection('https://api.mainnet-beta.solana.com');
        const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(privateKey)));

        // 2. Get quote
        const quoteResponse = await (
            await fetch(`https://quote-api.jup.ag/v6/quote?` +
                `inputMint=${inputMint}` +
                `&outputMint=So11111111111111111111111111111111111111112` + // SOL mint
                `&amount=${inputAmount}` +
                `&slippageBps=${slippageBps}`
            )
        ).json();
        console.log("quoteResponse: ")
        console.log(quoteResponse)

        // 3. Get swap transaction
        const { swapTransaction } = await (
            await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    // Add priority fee settings here
                    computeUnitPriceMicroLamports: 50000,
                    dynamicSlippage: { maxBps: slippageBps }
                })
            })
        ).json();
        console.log("swapTransaction: ")
        console.log(swapTransaction)

        // 4. Deserialize and sign the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        // Get the latest blockhash
        const latestBlockHash = await connection.getLatestBlockhash();

        transaction.sign([wallet.payer]);

        const rawTransaction = transaction.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
            maxRetries: 2,
        });

        // Use shorter confirmation timeout
        /*
        await connection.confirmTransaction({
            signature: txid,
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txid
        });*/

        //console.log(`https://solscan.io/tx/${txid}`);

        return {
            success: true,
            tx: `https://solscan.io/tx/${txid}`,
            message: 'Swap transaction successful'
        };

    } catch (error) {
        console.log(error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function getSolBalance(walletAddress) {
    try {
        //const connection = new Connection('https://api.mainnet-beta.solana.com');
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        return {
            success: true,
            balanceLamports: balance,
            balanceSOL: balance / 1000000000 // Convert lamports to SOL
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}


async function getTargetAmount(walletAddress, tradePercentage) {
    const balance = await getSolBalance(walletAddress);
    console.log("current Sol balance: ", balance)
    let targetAmount = Number((balance.balanceSOL * tradePercentage).toFixed(3));
    return targetAmount;
}

function solToLamports(sol) {
    return Math.round(sol * 1000000000); // 1 SOL = 1 billion lamports
}


let token = 'scout'
let decimals = 6
let balance = 1000
const TRADE_PERCENTAGE = 0.85

let target_amount = await getTargetAmount(WALLET_ADDRESS_DDC, TRADE_PERCENTAGE);
console.log("target_amount: ", target_amount)
let tx_result = await swapSolToToken(WALLET_PRIVATE_KEY_DDC, tokens[token], solToLamports(target_amount), 100);
console.log(tx_result)

// let tx_result = await swapTokenToSol(WALLET_PRIVATE_KEY_DDC, tokens[token], tokenToSmallestUnit(balance, decimals), 100);
// console.log(tx_result)


// let { balance } = await getTokenBalance(WALLET_ADDRESS_DDC, tokens[token]);
// console.log("balance: ", balance)