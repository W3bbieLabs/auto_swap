import inquirer from 'inquirer';
import chalk from 'chalk';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from "dotenv";
import { tokens } from "./web3_utils.js";
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
    WALLET_ADDRESS_DDC,
    WALLET_PRIVATE_KEY_E3R,
    WALLET_ADDRESS_E3R
} = process.env;

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function checkSolanaBalance() {
    // Get wallet address from user
    const answers = await inquirer.prompt({
        name: 'wallet_address',
        type: 'input',
        message: 'Enter Solana wallet address:',
        validate(input) {
            try {
                new PublicKey(input);
                return true;
            } catch (err) {
                return 'Please enter a valid Solana wallet address';
            }
        }
    });

    try {
        // Connect to Solana mainnet
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

        // Create public key from input address
        const publicKey = new PublicKey(answers.wallet_address);

        // Get balance
        const balance = await connection.getBalance(publicKey);

        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
        const solBalance = balance / 1000000000;

        console.log(chalk.green(`\nWallet Balance: ${solBalance} SOL`));

    } catch (error) {
        console.error(chalk.red('Error getting balance:', error.message));
    }
}


async function checkMultipleBalances(addresses) {
    try {
        // Connect to Solana mainnet
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

        let totalBalance = 0;

        // Get balance for each address
        for (const address of addresses) {
            try {
                const publicKey = new PublicKey(address);
                const balance = await connection.getBalance(publicKey);
                totalBalance += balance;
            } catch (err) {
                console.error(chalk.red(`Error getting balance for ${address}:`, err.message));
            }
        }

        // Convert total lamports to SOL
        const totalSol = totalBalance / 1000000000;

        console.log(chalk.green(`\nTotal Balance Across All Wallets: ${totalSol} SOL`));
        return totalSol;

    } catch (error) {
        console.error(chalk.red('Error in checkMultipleBalances:', error.message));
        return 0;
    }
}

async function getSwapTransactionsSolscan(walletAddress) {
    try {
        // Get transactions from Solscan API
        const response = await fetch(`https://public-api.solscan.io/account/transactions?account=${walletAddress}&limit=100`);
        const transactions = await response.json();
        console.log(transactions)

        console.log(chalk.blue('\nRecent Transactions:'));
        console.log(chalk.gray('----------------------------------------'));

        for (const tx of transactions) {
            console.log(chalk.yellow(`\nTransaction: ${tx.txHash}`));
            console.log(`Timestamp: ${new Date(tx.blockTime * 1000).toLocaleString()}`);
            console.log(`Status: ${tx.status ? chalk.green('Success') : chalk.red('Failed')}`);
            console.log(`Fee: ${tx.fee / 1e9} SOL`);

            // Get detailed transaction info
            const txDetailResponse = await fetch(`https://public-api.solscan.io/transaction/${tx.txHash}`);
            const txDetail = await txDetailResponse.json();

            if (txDetail.instructions) {
                for (const instruction of txDetail.instructions) {
                    console.log('Program ID:', instruction.programId || 'undefined');
                    console.log('Data:', instruction.data || '');
                    console.log('Accounts:', instruction.accounts || []);
                }
            }

            console.log(chalk.gray('----------------------------------------'));

            // Add delay to avoid rate limiting
            await sleep(1000);
        }

    } catch (error) {
        console.error(chalk.red('Error getting transactions from Solscan:', error.message));
    }

}
/*
async function listenToTokenSwaps(tokenMint) {
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    try {
        console.log(chalk.blue(`Starting to listen for swaps of token: ${tokenMint}`));

        // Subscribe to program account changes
        const subscriptionId = connection.onProgramAccountChange(
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Jupiter Program ID
            async (accountInfo, context) => {
                try {
                    // Get transaction details
                    const signature = context.slot.toString();
                    const tx = await connection.getTransaction(signature, {
                        maxSupportedTransactionVersion: 0
                    });

                    if (tx) {
                        // Check if transaction involves our token
                        const tokenInvolved = tx.transaction.message.accountKeys.some(
                            key => key.toString() === tokenMint
                        );

                        if (tokenInvolved) {
                            console.log(chalk.green('\nSwap Transaction Detected!'));
                            console.log(chalk.yellow(`Signature: ${signature}`));
                            console.log(`Time: ${new Date().toLocaleString()}`);
                            console.log(`Block: ${context.slot}`);
                            console.log(chalk.gray('----------------------------------------'));
                        }
                    }
                } catch (err) {
                    console.error(chalk.red('Error processing transaction:', err.message));
                }
            },
            'confirmed'
        );

        console.log(chalk.green('Listener established successfully'));
        console.log(chalk.gray('Waiting for swap transactions...'));

        // Return subscription ID so it can be used to unsubscribe later if needed
        return subscriptionId;

    } catch (error) {
        console.error(chalk.red('Error setting up swap listener:', error.message));
        throw error;
    }
}
*/


// Run the CLI
//checkSolanaBalance();
//console.log("starting")

//checkMultipleBalances([WALLET_ADDRESS_YB3])

//getSwapTransactions(WALLET_ADDRESS_YB3)
//getSwapTransactionsSolscan(WALLET_ADDRESS_YB3)
//listenToTokenSwaps(tokens['pengu'])




async function listenToTokenSwaps(tokenMint) {
    try {
        // Create PublicKey from token mint address
        const mintPubKey = new PublicKey(tokenMint);

        console.log(chalk.blue(`Setting up listener for token: ${tokenMint}`));

        // Subscribe to token account changes
        const subscriptionId = connection.onProgramAccountChange2(
            JUPITER_PROGRAM_ID,
            async (accountInfo, context) => {
                try {
                    console.log(chalk.green('\nPotential Swap Activity Detected!'));
                    console.log(chalk.yellow(`Slot: ${context.slot}`));
                    console.log(`Time: ${new Date().toLocaleString()}`);

                    // Get transaction details
                    const signature = context.signature;
                    if (signature) {
                        const txInfo = await connection.getTransaction(signature);
                        if (txInfo && txInfo.meta && txInfo.meta.postTokenBalances) {
                            const tokenSwaps = txInfo.meta.postTokenBalances.filter(
                                balance => balance.mint === tokenMint
                            );

                            if (tokenSwaps.length > 0) {
                                console.log(chalk.green('Confirmed swap involving target token!'));
                                console.log(`Transaction signature: ${signature}`);
                            }
                        }
                    }

                    console.log(chalk.gray('----------------------------------------'));
                } catch (err) {
                    console.error(chalk.red('Error processing swap event:', err.message));
                }
            },
            'confirmed'
        );

        console.log(chalk.green('Swap listener established successfully'));
        console.log(chalk.gray('Waiting for swap transactions...'));

        return subscriptionId;

    } catch (error) {
        console.error(chalk.red('Error setting up token swap listener:', error.message));
        throw error;
    }
}

//listenToTokenSwaps(tokens['pengu'])

/*
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');


// Jupiter Program ID
const JUPITER_PROGRAM_ID = new PublicKey('JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB');

(async () => {
    // Listen for program account changes
    connection.onAccountChange(
        JUPITER_PROGRAM_ID,
        (accountInfo, context) => {
            console.log(chalk.green('\nJupiter Swap Detected!'));
            console.log(chalk.yellow(`Slot: ${context.slot}`));
            console.log(`Time: ${new Date().toLocaleString()}`);
            console.log(chalk.gray('----------------------------------------'));
        },
        'confirmed'
    );

    console.log(chalk.green('Listening for Jupiter swaps...'));
})();
*/


///const connection = new solanaWeb3.Connection(“https://rpc.helius.xyz?api-key=“);
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
async function getLatestSignature(address) {
    const publicKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 100 });
    for (const signature of signatures) {
        console.log(`Signature: ${signature.signature}`);
        console.log(`Timestamp: ${new Date(signature.blockTime * 1000).toLocaleString()}`);
        const txInfo = await connection.getTransaction(signature.signature);
        console.log(txInfo)
        await sleep(5000)
        console.log('----------------------------------------');
    }
}

let target_address = "45QwnkQcoSFi8vEHFB1pKTGJ7JP1jvMGZ43xngq7n4gM"
await getLatestSignature(target_address)

setInterval(async () => {
    await getLatestSignature(target_address)
}, 20000)

// (async () => {
//     connection.onAccountChange(
//         new PublicKey("Habp5bncMSsBC3vkChyebepym5dcTNRYeg2LVG464E96"),
//         async (updatedAccountInfo, context) => {
//             console.log("getting latest signature")
//             await getLatestSignature()
//             await sleep(20000)
//             /*
//             console.log(chalk.green('\nAccount Update Detected!'));
//             console.log(chalk.yellow(`Slot: ${context.slot}`));
//             console.log(`Time: ${new Date().toLocaleString()}`);
//             console.log(chalk.gray('Account Data:'));
//             console.log(updatedAccountInfo.data);
//             console.log(`Owner: ${updatedAccountInfo.owner.toString()}`);
//             console.log(`Lamports: ${updatedAccountInfo.lamports}`);
//             console.log(chalk.gray('----------------------------------------'));
//             */
//         }, "confirmed");
// })();
