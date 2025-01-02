import express from "express";
import dotenv from "dotenv";
import { long, exit_long } from "./web3_utils.js";

dotenv.config();

const TRADING_VIEW_API_KEY = process.env.TRADING_VIEW_API_KEY;
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

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000. Changed restart startegy");
});

app.use(express.json());

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));


async function add_endpoint(endpoint, wallet_private_key, wallet_address, decimals = 6) {
    console.log("Adding endpoint", endpoint)
    app.post(endpoint, async (req, res) => {
        let { type, symbol, action, key } = req.body;
        symbol = req.url.split("/")[1]
        //console.log(wallet_private_key)
        console.log(`${endpoint} ${symbol} ${action} ${key}`)
        if (key === TRADING_VIEW_API_KEY) {
            try {
                if (action === "buy") {
                    for (let i = 0; i < wallet_private_key.length; i++) {
                        let result = await long(symbol, wallet_private_key[i], wallet_address[i])
                        res.status(200).json({ message: "Success" })
                        await sleep()
                        console.log(result)
                    }
                    return
                } else if (action === "sell") {
                    for (let i = 0; i < wallet_private_key.length; i++) {
                        let result = await exit_long(symbol, wallet_private_key[i], wallet_address[i], decimals)
                        res.status(200).json({ message: "Success" })
                        await sleep()
                        console.log(result)
                    }
                    return
                }
            } catch (error) {
                console.log("Error processing swap order:", error);
                //res.status(500).json({ message: "Error processing swap order", error: error.message });
                return;
            }

            res.status(401).json({ message: "Unauthorized" });
            console.log("Unauthorized");
            return;
        } else {
            console.log("Unauthorized")
        }
        res.json({ message: "" });
    });
}


add_endpoint("/pythia", [WALLETT_PRIVATE_KEY_YB3], [WALLET_ADDRESS_YB3])
add_endpoint("/swarm", [WALLET_PRIVATE_KEY_SNV], [WALLET_ADDRESS_SNV])
add_endpoint("/scout", [WALLET_PRIVATE_KEY_DDC], [WALLET_ADDRESS_DDC])
add_endpoint("/pengu", [WALLET_PRIVATE_KEY_E3R], [WALLET_ADDRESS_E3R])
add_endpoint("/ai16z", [WALLET_PRIVATE_KEY_4GM], [WALLET_ADDRESS_4GM], 9)
