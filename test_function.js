

// Function to get balance of any SPL token for a wallet
async function getTokenBalance(walletAddress, tokenMint) {
    try {
        //const connection = new Connection('https://api.mainnet-beta.solana.com');
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
        return {
            success: false,
            error: error.message
        };
    }
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
                    dynamicSlippage: { maxBps: slippageBps }
                })
            })
        ).json();
        console.log("swapTransaction: ")
        console.log(swapTransaction)

        // 4. Deserialize and sign the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([wallet.payer]);

        // 5. Execute the transaction
        const latestBlockHash = await connection.getLatestBlockhash();
        const rawTransaction = transaction.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2
        });

        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txid
        });

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
