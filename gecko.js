async function getSolPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();

        console.log('API Response:', data);

        if (!data || !data.solana) {
            throw new Error('Invalid API response structure');
        }

        return data.solana.usd;
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        throw error;
    }
}


async function getTop50Coins() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        const data = await response.json();
        return data.map(coin => ({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            current_price: coin.current_price,
            market_cap: (coin.market_cap / 1000000000).toFixed(2),
            market_cap_rank: coin.market_cap_rank,
            price_change_24h: coin.price_change_percentage_24h
        }));
    } catch (error) {
        console.error('Error fetching top 100 coins:', error);
        throw error;
    }
}

async function getSolanaHistory(days = 30) {
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=${days}`);
        const data = await response.json();
        return data.prices.map(priceData => ({
            timestamp: new Date(priceData[0]),
            price: priceData[1]
        }));
    } catch (error) {
        console.error('Error fetching Solana historical data:', error);
        throw error;
    }
}

async function getSolanaBinanceHistory(days = 30) {
    try {
        // Convert days to milliseconds and calculate start time
        const endTime = Date.now();
        const startTime = endTime - (days * 24 * 60 * 60 * 1000);

        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=1d&startTime=${startTime}&endTime=${endTime}`);
        const data = await response.json();

        console.log('API Response:', data);

        /*
        return data.map(kline => ({
            timestamp: new Date(kline[0]), // Open time
            price: parseFloat(kline[4])    // Close price
        }));*/
    } catch (error) {
        console.error('Error fetching Solana historical data from Binance:', error);
        throw error;
    }
}

async function getSolanaHistoricalData(days = 30) {
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=${days}&interval=daily`);
        const data = await response.json();
        console.log(data);
        // Write CSV data
        const csvContent = data.prices.map(row => `${new Date(row[0])},${row[1]}`).join('\n');
        await fs.writeFile('solana_prices.csv', 'timestamp,price\n' + csvContent);

        // Transform the data into a more usable format
        return {
            prices: data.prices.map(item => ({
                timestamp: new Date(item[0]),
                price: parseFloat(item[1]).toFixed(2)
            })),
            market_caps: data.market_caps.map(item => ({
                timestamp: new Date(item[0]),
                market_cap: (item[1] / 1000000000).toFixed(2) // Convert to billions
            })),
            total_volumes: data.total_volumes.map(item => ({
                timestamp: new Date(item[0]),
                volume: (item[1] / 1000000).toFixed(2) // Convert to millions
            }))
        };
    } catch (error) {
        console.error('Error fetching Solana historical data:', error);
        throw error;
    }
}

async function getSolanaHourlyData(hours = 24) {
    try {
        // Convert hours to milliseconds and calculate start time
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);

        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=1h&startTime=${startTime}&endTime=${endTime}`);
        const data = await response.json();
        console.log(data);
        // Transform the data into a more usable format
        return data.map(kline => ({
            timestamp: new Date(kline[0]), // Open time
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
            closeTime: new Date(kline[6])
        }));

    } catch (error) {
        console.error('Error fetching hourly Solana data from Binance:', error);
        throw error;
    }
}


//let solPrice = await getSolPrice();
//console.log(solPrice);

//let top50Coins = await getTop50Coins();
//console.log(top50Coins);

//let solanaHistory = await getSolanaHistory(30);
//let n = solanaHistory.length;
//console.log(solanaHistory);

//let solanaBinanceHistory = await getSolanaBinanceHistory(30);
//console.log(solanaBinanceHistory);

//let solanaHistoricalData = await getSolanaHistoricalData(30);
//console.log(solanaHistoricalData);

let solanaHourlyData = await getSolanaHourlyData(24);
console.log(solanaHourlyData);