const inquirer = require('inquirer');
const chalk = require('chalk');
const { Connection, PublicKey } = require('@solana/web3.js');

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

// Run the CLI
checkSolanaBalance();
console.log("starting")
