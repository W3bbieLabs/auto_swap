#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import gradient from 'gradient-string';
import chalkAnimation from 'chalk-animation';
import figlet from 'figlet';
import { createSpinner } from 'nanospinner';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';

let openai = null
let anthropicClient = null

let platform = process.platform;
let folderName;
let agentName;
let selectedProvider;
let apiKey = "";
let agentType;
let agentDescription;
let twitterUsername = "";
let twitterEmail = "";
let twitterPassword = "";

let envTemplate = `
# Discord Configuration
DISCORD_APPLICATION_ID=
DISCORD_API_TOKEN=              # Bot token
DISCORD_VOICE_CHANNEL_ID=       # The ID of the voice channel the bot should join (optional)

# AI Model API Keys
OPENAI_API_KEY=                 # OpenAI API key, starting with sk-
SMALL_OPENAI_MODEL=             # Default: gpt-4o-mini
MEDIUM_OPENAI_MODEL=            # Default: gpt-4o
LARGE_OPENAI_MODEL=             # Default: gpt-4o
EMBEDDING_OPENAI_MODEL=         # Default: text-embedding-3-small
IMAGE_OPENAI_MODEL=             # Default: dall-e-3

# Eternal AI's Decentralized Inference API
ETERNALAI_URL=
ETERNALAI_MODEL=                # Default: "neuralmagic/Meta-Llama-3.1-405B-Instruct-quantized.w4a16"
ETERNALAI_API_KEY=

GROK_API_KEY=                   # GROK API Key
GROQ_API_KEY=                   # Starts with gsk_
OPENROUTER_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=   # Gemini API key

ALI_BAILIAN_API_KEY=            # Ali Bailian API Key
NANOGPT_API_KEY=                # NanoGPT API Key

HYPERBOLIC_API_KEY=             # Hyperbolic API Key
HYPERBOLIC_MODEL=
IMAGE_HYPERBOLIC_MODEL=         # Default: FLUX.1-dev
SMALL_HYPERBOLIC_MODEL=         # Default: meta-llama/Llama-3.2-3B-Instruct
MEDIUM_HYPERBOLIC_MODEL=        # Default: meta-llama/Meta-Llama-3.1-70B-Instruct
LARGE_HYPERBOLIC_MODEL=         # Default: meta-llama/Meta-Llama-3.1-405-Instruct

# Speech Synthesis
ELEVENLABS_XI_API_KEY=          # API key from elevenlabs

# ElevenLabs Settings
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_VOICE_STABILITY=0.5
ELEVENLABS_VOICE_SIMILARITY_BOOST=0.9
ELEVENLABS_VOICE_STYLE=0.66
ELEVENLABS_VOICE_USE_SPEAKER_BOOST=false
ELEVENLABS_OPTIMIZE_STREAMING_LATENCY=4
ELEVENLABS_OUTPUT_FORMAT=pcm_16000

# Twitter/X Configuration
TWITTER_DRY_RUN=false
TWITTER_USERNAME=               # Account username
TWITTER_PASSWORD=               # Account password
TWITTER_EMAIL=                  # Account email
TWITTER_2FA_SECRET=

TWITTER_COOKIES=                # Account cookies
TWITTER_POLL_INTERVAL=900       # How often (in seconds) the bot should check for interactions
TWITTER_SEARCH_ENABLE=FALSE     # Enable timeline search, WARNING this greatly increases your chance of getting banned
TWITTER_TARGET_USERS=           # Comma separated list of Twitter user names to interact with

X_SERVER_URL=
XAI_API_KEY=
XAI_MODEL=

# Post Interval Settings (in minutes)
POST_INTERVAL_MIN=              # Default: 90
POST_INTERVAL_MAX=              # Default: 180
POST_IMMEDIATELY=

# Twitter action processing configuration
ACTION_INTERVAL=1800000      # Interval in milliseconds between action processing runs (set: 15 minutes)
ENABLE_ACTION_PROCESSING=false   # Set to true to enable the action processing loop

# Feature Flags
IMAGE_GEN=                      # Set to TRUE to enable image generation
USE_OPENAI_EMBEDDING=           # Set to TRUE for OpenAI/1536, leave blank for local
USE_OLLAMA_EMBEDDING=           # Set to TRUE for OLLAMA/1024, leave blank for local

# OpenRouter Models
OPENROUTER_MODEL=               # Default: uses hermes 70b/405b
SMALL_OPENROUTER_MODEL=
MEDIUM_OPENROUTER_MODEL=
LARGE_OPENROUTER_MODEL=

# REDPILL Configuration
# https://docs.red-pill.ai/get-started/supported-models
REDPILL_API_KEY=                # REDPILL API Key
REDPILL_MODEL=
SMALL_REDPILL_MODEL=            # Default: gpt-4o-mini
MEDIUM_REDPILL_MODEL=           # Default: gpt-4o
LARGE_REDPILL_MODEL=            # Default: gpt-4o

# Grok Configuration
SMALL_GROK_MODEL=       # Default: grok-2-1212
MEDIUM_GROK_MODEL=      # Default: grok-2-1212
LARGE_GROK_MODEL=       # Default: grok-2-1212
EMBEDDING_GROK_MODEL=   # Default: grok-2-1212

# Ollama Configuration
OLLAMA_SERVER_URL=              # Default: localhost:11434
OLLAMA_MODEL=
OLLAMA_EMBEDDING_MODEL=         # Default: mxbai-embed-large
SMALL_OLLAMA_MODEL=             # Default: llama3.2
MEDIUM_OLLAMA_MODEL=          # Default: hermes3
LARGE_OLLAMA_MODEL=             # Default: hermes3:70b

# Google Configuration
GOOGLE_MODEL=
SMALL_GOOGLE_MODEL=             # Default: gemini-1.5-flash-latest
MEDIUM_GOOGLE_MODEL=            # Default: gemini-1.5-flash-latest
LARGE_GOOGLE_MODEL=             # Default: gemini-1.5-pro-latest
EMBEDDING_GOOGLE_MODEL=         # Default: text-embedding-004

# Groq Configuration
SMALL_GROQ_MODEL=               # Default: llama-3.1-8b-instant
MEDIUM_GROQ_MODEL=              # Default: llama-3.3-70b-versatile
LARGE_GROQ_MODEL=               # Default: llama-3.2-90b-vision-preview
EMBEDDING_GROQ_MODEL=           # Default: llama-3.1-8b-instant

# LlamaLocal Configuration
LLAMALOCAL_PATH=                # Default: "" which is the current directory in plugin-node/dist/ which gets destroyed and recreated on every build

# NanoGPT Configuration
SMALL_NANOGPT_MODEL=            # Default: gpt-4o-mini
MEDIUM_NANOGPT_MODEL=           # Default: gpt-4o
LARGE_NANOGPT_MODEL=            # Default: gpt-4o

# Anthropic Configuration
ANTHROPIC_API_KEY=              # For Claude
SMALL_ANTHROPIC_MODEL=          # Default: claude-3-haiku-20240307
MEDIUM_ANTHROPIC_MODEL=         # Default: claude-3-5-sonnet-20241022
LARGE_ANTHROPIC_MODEL=          # Default: claude-3-5-sonnet-20241022

# Heurist Configuration
HEURIST_API_KEY=                # Get from https://heurist.ai/dev-access
SMALL_HEURIST_MODEL=            # Default: meta-llama/llama-3-70b-instruct
MEDIUM_HEURIST_MODEL=           # Default: meta-llama/llama-3-70b-instruct
LARGE_HEURIST_MODEL=            # Default: meta-llama/llama-3.1-405b-instruct
HEURIST_IMAGE_MODEL=            # Default: PepeXL

# Gaianet Configuration
GAIANET_MODEL=qwen72b
GAIANET_SERVER_URL=https://qwen72b.gaia.domains/v1
GAIANET_EMBEDDING_MODEL=nomic-embed
USE_GAIANET_EMBEDDING=true


SMALL_GAIANET_MODEL=            # Default: llama3b
SMALL_GAIANET_SERVER_URL=       # Default: https://llama3b.gaia.domains/v1
MEDIUM_GAIANET_MODEL=           # Default: llama
MEDIUM_GAIANET_SERVER_URL=      # Default: https://llama8b.gaia.domains/v1
LARGE_GAIANET_MODEL=            # Default: qwen72b
LARGE_GAIANET_SERVER_URL=       # Default: https://qwen72b.gaia.domains/v1

# EVM
EVM_PRIVATE_KEY=
EVM_PROVIDER_URL=

# Solana
SOLANA_PRIVATE_KEY=
SOLANA_PUBLIC_KEY=
SOLANA_CLUSTER= # Default: devnet. Solana Cluster: 'devnet' | 'testnet' | 'mainnet-beta'
SOLANA_ADMIN_PRIVATE_KEY= # This wallet is used to verify NFTs
SOLANA_ADMIN_PUBLIC_KEY= # This wallet is used to verify NFTs
SOLANA_VERIFY_TOKEN= # Authentication token for calling the verification API

# Fallback Wallet Configuration (deprecated)
WALLET_PRIVATE_KEY=
WALLET_PUBLIC_KEY=

BIRDEYE_API_KEY=

# Solana Configuration
SOL_ADDRESS=So11111111111111111111111111111111111111112
SLIPPAGE=1
BASE_MINT=So11111111111111111111111111111111111111112
RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=

# Telegram Configuration
TELEGRAM_BOT_TOKEN=

# Together Configuration
TOGETHER_API_KEY=

# Server Configuration
SERVER_PORT=3000

# Starknet Configuration
STARKNET_ADDRESS=
STARKNET_PRIVATE_KEY=
STARKNET_RPC_URL=

# Intiface Configuration
INTIFACE_WEBSOCKET_URL=ws://localhost:12345

# Farcaster Neynar Configuration
FARCASTER_FID=                  # The FID associated with the account your are sending casts from
FARCASTER_NEYNAR_API_KEY=       # Neynar API key: https://neynar.com/
FARCASTER_NEYNAR_SIGNER_UUID=   # Signer for the account you are sending casts from. Create a signer here: https://dev.neynar.com/app
FARCASTER_DRY_RUN=false         # Set to true if you want to run the bot without actually publishing casts
FARCASTER_POLL_INTERVAL=120     # How often (in seconds) the bot should check for farcaster interactions (replies and mentions)

# Coinbase
COINBASE_COMMERCE_KEY=          # From Coinbase developer portal
COINBASE_API_KEY=               # From Coinbase developer portal
COINBASE_PRIVATE_KEY=           # From Coinbase developer portal
COINBASE_GENERATED_WALLET_ID=   # Not your address but the wallet ID from generating a wallet through the plugin
COINBASE_GENERATED_WALLET_HEX_SEED= # Not your address but the wallet hex seed from generating a wallet through the plugin and calling export
COINBASE_NOTIFICATION_URI=      # For webhook plugin the uri you want to send the webhook to for dummy ones use https://webhook.site

# Coinbase Charity Configuration
IS_CHARITABLE=false   # Set to true to enable charity donations
CHARITY_ADDRESS_BASE=0x1234567890123456789012345678901234567890
CHARITY_ADDRESS_SOL=pWvDXKu6CpbKKvKQkZvDA66hgsTB6X2AgFxksYogHLV
CHARITY_ADDRESS_ETH=0x750EF1D7a0b4Ab1c97B7A623D7917CcEb5ea779C
CHARITY_ADDRESS_ARB=0x1234567890123456789012345678901234567890
CHARITY_ADDRESS_POL=0x1234567890123456789012345678901234567890

# Conflux Configuration
CONFLUX_CORE_PRIVATE_KEY=
CONFLUX_CORE_SPACE_RPC_URL=
CONFLUX_ESPACE_PRIVATE_KEY=
CONFLUX_ESPACE_RPC_URL=
CONFLUX_MEME_CONTRACT_ADDRESS=

# ZeroG
ZEROG_INDEXER_RPC=
ZEROG_EVM_RPC=
ZEROG_PRIVATE_KEY=
ZEROG_FLOW_ADDRESS=

# TEE Configuration
# TEE_MODE options:
# - LOCAL: Uses simulator at localhost:8090 (for local development)
# - DOCKER: Uses simulator at host.docker.internal:8090 (for docker development)
# - PRODUCTION: No simulator, uses production endpoints
# Defaults to OFF if not specified
TEE_MODE=OFF                    # LOCAL | DOCKER | PRODUCTION
WALLET_SECRET_SALT=             # ONLY define if you want to use TEE Plugin, otherwise it will throw errors

# Galadriel Configuration
GALADRIEL_API_KEY=gal-*         # Get from https://dashboard.galadriel.com/

# Venice Configuration
VENICE_API_KEY=                 # generate from venice settings
SMALL_VENICE_MODEL=             # Default: llama-3.3-70b
MEDIUM_VENICE_MODEL=            # Default: llama-3.3-70b
LARGE_VENICE_MODEL=             # Default: llama-3.1-405b
IMAGE_VENICE_MODEL=             # Default: fluently-xl

# fal.ai Configuration
FAL_API_KEY=
FAL_AI_LORA_PATH=

# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=          # Permanent access token from Facebook Developer Console
WHATSAPP_PHONE_NUMBER_ID=       # Phone number ID from WhatsApp Business API
WHATSAPP_BUSINESS_ACCOUNT_ID=   # Business Account ID from Facebook Business Manager
WHATSAPP_WEBHOOK_VERIFY_TOKEN=  # Custom string for webhook verification
WHATSAPP_API_VERSION=v17.0      # WhatsApp API version (default: v17.0)

# Flow Blockchain Configuration
FLOW_ADDRESS=
FLOW_PRIVATE_KEY=               # Private key for SHA3-256 + P256 ECDSA
FLOW_NETWORK=                   # Default: mainnet
FLOW_ENDPOINT_URL=              # Default: https://mainnet.onflow.org

# ICP
INTERNET_COMPUTER_PRIVATE_KEY=
INTERNET_COMPUTER_ADDRESS=

# Aptos
APTOS_PRIVATE_KEY=              # Aptos private key
APTOS_NETWORK=                  # Must be one of mainnet, testnet

# EchoChambers Configuration
ECHOCHAMBERS_API_URL=http://127.0.0.1:3333
ECHOCHAMBERS_API_KEY=testingkey0011
ECHOCHAMBERS_USERNAME=eliza
ECHOCHAMBERS_DEFAULT_ROOM=general
ECHOCHAMBERS_POLL_INTERVAL=60
ECHOCHAMBERS_MAX_MESSAGES=10

# MultiversX
MVX_PRIVATE_KEY= # Multiversx private key
MVX_NETWORK= # must be one of mainnet, devnet, testnet

# NEAR
NEAR_WALLET_SECRET_KEY=
NEAR_WALLET_PUBLIC_KEY=
NEAR_ADDRESS=
SLIPPAGE=1
RPC_URL=https://rpc.testnet.near.org
NEAR_NETWORK=testnet # or mainnet

# ZKsync Era Configuration
ZKSYNC_ADDRESS=
ZKSYNC_PRIVATE_KEY=

# Ton
TON_PRIVATE_KEY= # Ton Mnemonic Seed Phrase Join With Empty String
TON_RPC_URL=     # ton rpc

# AWS S3 Configuration Settings for File Upload
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
AWS_S3_UPLOAD_PATH=

# Deepgram
DEEPGRAM_API_KEY=

# Sui
SUI_PRIVATE_KEY= 
SUI_NETWORK=     

# Story
STORY_PRIVATE_KEY= # Story private key
STORY_API_BASE_URL= # Story API base URL
STORY_API_KEY= # Story API key
PINATA_JWT= # Pinata JWT for uploading files to IPFS
`



function getOperatingSystem() {
    switch (platform) {
        case 'win32':
            return 'WINDOWS';
        case 'darwin':
            return 'MACOS';
        case 'linux':
            return 'LINUX';
        default:
            return 'UNKNOWN';
    }
}

const execAsync = promisify(exec);

async function retryWithNewName() {
    console.log(chalk.yellow('\nLet\'s try with a different agent name.'));
    await askName(); // This will get a new name from the user
    await cloneElizaRepo(); // Try cloning again with the new name
}

async function cloneElizaRepo() {
    folderName = `agents/`;

    // Add folder existence check
    /*
    if (existsSync(folderName)) {
        //console.log(chalk.red(`\nFolder '${folderName}' already exists.`));
        await retryWithNewName();
        return;
    }*/

    // Assume the eliza project has already been cloned, installed, and built
    if (existsSync("agents")) {
        await generate_character_file(agentDescription, `${folderName}/characters/${agentName}.character.json`)

        let env_string = createTwitterEnvTemplate(twitterUsername, twitterPassword, twitterEmail)

        if (apiKey !== '') {
            env_string = createOpenEnvTemplate(apiKey)
        }

        await writeEnvFile(env_string, `${folderName}/agent/.env`)

        await startAgent(agentName);

        return
    }

    let spinner = createSpinner('Cloning Eliza repository...').start();
    try {
        // Check if correct Node version is installed
        const hasCorrectVersion = await checkNodeVersion();
        if (!hasCorrectVersion) {
            // Install the correct version if not present
            await execAsync('. ~/.nvm/nvm.sh && nvm install 23.3.0');
        }

        // Use the correct version
        await execAsync('. ~/.nvm/nvm.sh && nvm use 23.3.0');
        await execAsync(`git clone -b v0.1.7-alpha.1 https://github.com/ai16z/eliza.git ${folderName}`);
        //await execAsync(`cd ${folderName} && git checkout develop`);
        //await execAsync(`curl -o ${folderName}/packages/client-twitter/src/post.ts https://raw.githubusercontent.com/W3bbieLabs/init-eliza/refs/heads/main/src/post.ts`);

        // Generate the .env file
        let env_string = createTwitterEnvTemplate(twitterUsername, twitterPassword, twitterEmail)

        if (apiKey !== '') {
            env_string = createOpenEnvTemplate(apiKey)
        }

        await writeEnvFile(env_string, `${folderName}/agent/.env`)

        // Check and install pnpm if needed
        await installPnpm();

        // Generate the character 
        spinner.success({ text: `Successfully installed Eliza into ${folderName}` });

        await generate_character_file(agentDescription, `${folderName}/characters/${agentName}.character.json`)

        spinner = createSpinner('Setting up Eliza...').start();

        // Now run pnpm commands
        spinner.update({ text: 'Installing Eliza' });

        let { stdout1, stderr1 } = await execAsync(`cd ${folderName} && . ~/.nvm/nvm.sh && nvm use 23.3.0 && pnpm i --no-frozen-lockfile`);
        if (stderr1) console.error('Errors:', stderr1);
        spinner.update({ text: 'Building Eliza. This may take a while... Grab a coffee ☕' });

        let { stdout2, stderr2 } = await execAsync(`cd ${folderName} && . ~/.nvm/nvm.sh && nvm use 23.3.0 && pnpm build`);
        if (stderr2) console.error('Errors:', stderr2);

        spinner.success({ text: `Successfully configured Eliza.` });

        console.log(chalk.green('Starting agent...'));
        await startAgent(agentName);

    } catch (error) {
        spinner.error({ text: 'Failed to clone repository' });
        console.error(chalk.red('Error details:', error.message));
    }
}

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));
async function showMainMenu() {
    const answers = await inquirer.prompt({
        name: 'action',
        type: 'list',
        message: 'What would you like to do?',
        choices: [
            'Create Agent',
            'Start Agent',
            'Remove Agent',
            'List Agents',
            'Chat with Agent',
            'Reinstall SQLite',
            'Exit'
        ]
    });

    switch (answers.action) {
        case 'Create Agent':
            await askName();

            await selectProvider();
            if (selectedProvider !== 'cancel') {
                await configureAPI();
            }
            await selectAgentType();
            await getTwitterCredentials();
            await getAgentDescription();
            await cloneElizaRepo();
            break;
        case 'Start Agent':
            await startExistingAgent();
            break;
        case 'Remove Agent':
            await removeAgent();
            break;
        case 'List Agents':
            await listAgents();
            break;
        case 'Chat with Agent':
            await sendMessageToAgentMenu();
            break;
        case 'Reinstall SQLite':
            await fixStupidSQLiteIssue();
            await showMainMenu();
            break;
        case 'Exit':
            console.log(chalk.green('Thanks for using Init-Eliza!'));
            process.exit(0);
            break;
    }
}

async function removeAgent() {
    const agentsDir = 'agents';

    // Check if agents directory exists
    if (!existsSync(agentsDir)) {
        console.log(chalk.red('\nNo agents directory found.'));
        await showMainMenu();
        return;
    }

    try {
        // Get list of agent folders
        let agents = readdirSync(path.join(agentsDir, 'characters'), { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name)
            .filter(name => name.endsWith('.character.json'))
            .map(name => name.split('.')[0]);

        if (agents.length === 0) {
            console.log(chalk.yellow('\nNo agents found to remove.'));
            await showMainMenu();
            return;
        }

        // Let user select an agent to remove
        const answer = await inquirer.prompt({
            name: 'selectedAgent',
            type: 'list',
            message: 'Select an agent to remove:',
            choices: [...agents, 'Back to Main Menu']
        });

        if (answer.selectedAgent === 'Back to Main Menu') {
            await showMainMenu();
            return;
        }

        // Confirm deletion
        const confirmation = await inquirer.prompt({
            name: 'confirm',
            type: 'confirm',
            message: chalk.red(`Are you sure you want to delete agent '${answer.selectedAgent}'? This cannot be undone.`),
            default: false
        });

        if (confirmation.confirm) {
            const spinner = createSpinner('Removing agent...').start();
            try {
                await execAsync(`rm agents/characters/${answer.selectedAgent}.character.json`);
                spinner.success({ text: `Successfully removed agent: ${answer.selectedAgent}` });
                await showMainMenu();
            } catch (error) {
                spinner.error({ text: 'Failed to remove agent' });
                console.error(chalk.red('Error details:', error.message));
                await showMainMenu();
            }
        } else {
            console.log(chalk.yellow('\nAgent deletion cancelled.'));
        }

    } catch (error) {
        console.error(chalk.red('Error reading agents directory:', error.message));
        await showMainMenu();
    }
}

async function listAgents() {
    const agentsDir = 'agents';

    if (!existsSync(agentsDir)) {
        console.log(chalk.red('\nNo agents directory found.'));
        return;
    }

    try {
        // Get list of agent folders
        let agents = readdirSync(path.join(agentsDir, 'characters'), { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name)
            .filter(name => name.endsWith('.character.json'))
            .map(name => name.split('.')[0]);

        if (agents.length === 0) {
            console.log(chalk.yellow('\nNo agents found.'));
            return;
        }

        console.log(chalk.blue('\nAvailable Agents:'));
        agents.forEach((agent, index) => {
            console.log(chalk.green(`${index + 1}. ${agent}`));
        });

        await sleep(10);

        // Prompt user for next action
        const { action } = await inquirer.prompt({
            name: 'action',
            type: 'list',
            message: 'What would you like to do next?',
            choices: [
                'Return to Main Menu',
                'Exit Program'
            ]
        });

        if (action === 'Return to Main Menu') {
            await showMainMenu();
        } else {
            console.log(chalk.green('Thanks for using Init-Eliza!'));
            process.exit(0);
        }

    } catch (error) {
        console.error(chalk.red('Error reading agents directory:', error.message));
    }
}




async function askName() {
    const answers = await inquirer.prompt({
        name: 'player_name',
        type: 'input',
        message: 'What is the name of your agent?',
        default() {
            return 'Agent1';
        },
    });

    agentName = answers.player_name;
}

async function isOllamaInstalled() {
    try {
        await execAsync('which ollama');
        return true;
    } catch (error) {
        return false;
    }
}

async function installOllama() {
    const os = getOperatingSystem();
    const spinner = createSpinner('Checking Ollama installation...').start();

    if (os !== 'LINUX') {
        spinner.error({ text: 'Ollama installation is only supported on Linux systems' });
        return;
    }

    const ollamaInstalled = await isOllamaInstalled();
    if (ollamaInstalled) {
        spinner.success({ text: 'Ollama is already installed' });
        return;
    }

    spinner.update({ text: 'Installing Ollama...' });
    try {
        await execAsync('curl -fsSL https://ollama.com/install.sh | sh');
        spinner.success({ text: 'Successfully installed Ollama' });
    } catch (error) {
        spinner.error({ text: 'Failed to install Ollama' });
        console.error(chalk.red('Error details:', error.message));
    }
}

async function selectProvider() {
    const answers = await inquirer.prompt({
        name: 'provider',
        type: 'list',
        message: 'Select a Model:',
        choices: [
            'openai',
            'anthropic',
            'claude_vertex',
            'cancel'
        ]
    });

    selectedProvider = answers.provider;
}

async function configureAPI() {
    const shouldSetAPI = await inquirer.prompt({
        name: 'setAPI',
        type: 'list',
        message: 'Would you like to configure the API key?',
        choices: ['Enter API Key', 'Skip']
    });


    if (shouldSetAPI.setAPI === 'Enter API Key') {
        const apiKeyInput = await inquirer.prompt({
            name: 'key',
            type: 'input',
            message: 'Enter your API key:',
        });
        apiKey = apiKeyInput.key;

        if (selectedProvider === 'openai') {
            openai = new OpenAI({ apiKey });
        } else if (selectedProvider === 'anthropic') {
            anthropicClient = new Anthropic({ apiKey });
        }

    } else {
        selectedProvider = 'cancel';
    }
}

async function getTwitterCredentials() {
    if (agentType === 'Create Twitter Agent') {
        const twitterAnswers = await inquirer.prompt([
            {
                name: 'twitter_username',
                type: 'input',
                message: 'Enter your Twitter username:',
                validate(input) {
                    return input.length > 0 ? true : 'Username is required';
                }
            },
            {
                name: 'twitter_email',
                type: 'input',
                message: 'Enter your Twitter email:',
                validate(input) {
                    return input.length > 0 && input.includes('@') ? true : 'Please enter a valid email';
                }
            },
            {
                name: 'twitter_password',
                type: 'password',
                message: 'Enter your Twitter password:',
                mask: '*',
                validate(input) {
                    return input.length > 0 ? true : 'Password is required';
                }
            }
        ]);

        twitterUsername = twitterAnswers.twitter_username;
        twitterEmail = twitterAnswers.twitter_email;
        twitterPassword = twitterAnswers.twitter_password;
    } else if (agentType === 'Create Discord Agent' || agentType === 'Create Agent Swarm') {
        console.log(chalk.yellow('\n⚠️ This feature is currently in development and will be available soon!\n'));
        await showMainMenu();
    }
}

async function selectAgentType() {
    const answers = await inquirer.prompt({
        name: 'agent',
        type: 'list',
        message: 'Select an agent type:',
        choices: [
            'Create Local Agent',
            'Create Twitter Agent',
        ]
    });

    agentType = answers.agent;
}

async function getAgentDescription() {
    const answers = await inquirer.prompt({
        name: 'description',
        type: 'input',
        message: 'Describe your agent\'s purpose and functionality:',
        validate(input) {
            return input.length > 0 ? true : 'Please provide a description';
        }
    });

    agentDescription = answers.description;
}

function showSummary() {
    console.clear();
    figlet(`Agent Summary`, (err, data) => {
        console.log(gradient.pastel.multiline(data) + '\n');

        console.log(`
        ${chalk.blue('Agent Configuration Summary')}
        ${chalk.yellow('Agent Name:')} ${agentName}
        ${chalk.yellow('Provider:')} ${selectedProvider}
        ${chalk.yellow('API Key Status:')} ${apiKey ? 'Configured' : 'Skipped'}
        ${chalk.yellow('Agent Type:')} ${agentType}
        ${chalk.yellow('Description:')} ${agentDescription}
        ${agentType === 'Create Twitter Agent' ? `
        ${chalk.blue('Twitter Configuration')}
        ${chalk.yellow('Username:')} ${twitterUsername}
        ${chalk.yellow('Email:')} ${twitterEmail}
        ${chalk.yellow('Password:')} ${'*'.repeat(twitterPassword?.length || 0)}
        ` : ''}
        `);

        console.log(
            chalk.green(
                `🤖 Agent configuration complete! Ready to build.`
            )
        );
        process.exit(0);
    });
}

function show_title() {

    figlet(`Init-Eliza`, (err, data) => {
        console.log(gradient.pastel.multiline(data) + '\n');


        console.log(
            chalk.green(
                `Built by W3bbie\n`
            )
        );
        console.log(
            chalk.green(
                `https://w3bbie.xyz/\n`
            )
        );
    });
}

async function prepareNvmEnvironment() {
    const spinner = createSpinner('Checking NVM installation...').start();

    try {
        // Check if nvm is installed
        await execAsync('command -v nvm');
        spinner.success({ text: 'NVM is already installed' });
    } catch (error) {
        // NVM is not installed
        spinner.update({ text: 'Installing NVM...' });
        try {
            // Install NVM
            await execAsync('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash');

            // Source NVM
            await execAsync('source ~/.nvm/nvm.sh');

            spinner.success({ text: 'Successfully installed NVM' });
        } catch (installError) {
            spinner.error({ text: 'Failed to install NVM' });
            console.error(chalk.red('Error details:', installError.message));
            return false;
        }
    }

    // Install Node.js LTS version
    spinner.update({ text: 'Installing Node.js LTS version...' });
    try {
        await execAsync('. ~/.nvm/nvm.sh install 23.3.0');
        await execAsync('. ~/.nvm/nvm.sh use 23.3.0');
        spinner.success({ text: 'Successfully installed Node.js LTS version' });
        return true;
    } catch (nodeError) {
        spinner.error({ text: 'Failed to install Node.js LTS version' });
        console.error(chalk.red('Error details:', nodeError.message));
        return false;
    }
}

async function startApp() {
    console.clear();
    await show_title();
    await sleep();

    // Prepare NVM environment

    await showMainMenu()
    //await sleep();
    //await prepareNvmEnvironment();
    //showSummary();
}

async function checkNodeVersion() {
    const spinner = createSpinner('Checking Node.js version...').start();
    try {
        // Source nvm and check if version exists
        const { stdout } = await execAsync('. ~/.nvm/nvm.sh && nvm ls | grep "v23.3.0"');

        if (stdout.includes('v23.3.0')) {
            spinner.success({ text: 'Node.js v23.3.0 is already installed' });
            return true;
        } else {
            spinner.info({ text: 'Node.js v23.3.0 is not installed' });
            return false;
        }
    } catch (error) {
        spinner.error({ text: 'Error checking Node.js version' });
        console.error(chalk.red('Error details:', error.message));
        return false;
    }
}

async function fixStupidSQLiteIssue() {
    // This is to fix the better-sqlite3 issue. Temporary fix. Not ideal.
    let spinner = createSpinner('Waking up agent...').start();
    await execAsync(`rm -rf agents/node_modules/better-sqlite3`);
    spinner.update({ text: 'Removed better-sqlite3' });
    await execAsync(`pnpm store prune`);
    spinner.update({ text: 'Pruned store' });
    await execAsync(`pnpm add better-sqlite3 --force -w`);
    spinner.update({ text: 'Added better-sqlite3' });
    spinner.success({ text: 'Agent is awake!' });
}

async function startAgent(agent_path) {

    // Not sure if this is needed. Avoids the stupid better-sqlite3 issue.
    //await fixStupidSQLiteIssue();

    let p = `--character="characters/${agent_path}.character.json"`
    console.log(`p:${p}`)
    const child = spawn('pnpm', ['start', `--character="characters/${agent_path}.character.json"`], {
        cwd: `agents/`,
        shell: true,
        stdio: 'inherit' // This will pipe the process output directly to the parent process
    });

    // Handle process exit
    return new Promise((resolve, reject) => {
        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

async function isPnpmInstalled() {
    try {
        await execAsync('which pnpm');
        return true;
    } catch (error) {
        return false;
    }
}

async function installPnpm() {
    const spinner = createSpinner('Checking pnpm installation...').start();
    try {
        const pnpmInstalled = await isPnpmInstalled();
        if (pnpmInstalled) {
            spinner.success({ text: 'pnpm is already installed' });
            return true;
        }

        spinner.update({ text: 'Installing pnpm...' });
        await execAsync('curl -fsSL https://get.pnpm.io/install.sh | sh -');

        // Source the updated PATH to make pnpm available
        await execAsync('source /home/ubuntu/.bashrc');

        spinner.success({ text: 'Successfully installed pnpm' });
        return true;
    } catch (error) {
        spinner.error({ text: 'Failed to install pnpm' });
        console.error(chalk.red('Error details:', error.message));
        return false;
    }
}

async function startExistingAgent() {
    const agentsDir = 'agents';
    let agents;

    // Check if agents directory exists
    if (!existsSync(agentsDir)) {
        console.log(chalk.red('\nNo agents directory found.'));
        return;
    }

    try {
        // Get list of agent folders
        agents = readdirSync(path.join(agentsDir, 'characters'), { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name)
            .filter(name => name.endsWith('.character.json'))
            .map(name => name.split('.')[0]);

        agents.push("<Main Menu")
        if (agents.length === 0) {
            console.log(chalk.yellow('\nNo agents found. Create an agent first.'));
            return;
        }

        // Let user select an agent
        const answer = await inquirer.prompt({
            name: 'selectedAgent',
            type: 'list',
            message: 'Select an agent to start:',
            choices: agents
        });

        if (answer.selectedAgent === "<Main Menu") {
            await showMainMenu();
            return;
        }

        //const selectedAgentPath = path.join(agentsDir, answer.selectedAgent);
        console.log(chalk.yellow(`Starting Agent: ${answer.selectedAgent}`));

        try {
            await startAgent(answer.selectedAgent);
        } catch (error) {
            console.error(chalk.red('Error details:', error.message));
        }

        //await startAgent(selectedAgentPath);


    } catch (error) {
        console.error(chalk.red('Error reading agents directory:', error.message));
    }
}


async function makeGaiaNetRequest(messages, model = "llama") {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch('https://qwen72b.gaia.domains/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages,
                    model
                }),
                timeout: 30000 // 30 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.log(chalk.yellow(`Retrying (${attempt} / ${maxRetries})...`));

            if (attempt === maxRetries) {
                // If all retries failed, return a fallback response
                return {
                    choices: [{
                        message: {
                            content: "I apologize, but I'm having trouble connecting to the server right now. Please try again later."
                        }
                    }]
                };
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
    }
}

async function makeOpenAIRequest(messages, model = "gpt-4o-mini") {
    const completion = await openai.chat.completions.create({ model, messages });
    let output = completion.choices[0].message.content
    console.log(chalk.blueBright(`\n${output}`));
    return output
}

async function makeClaudeRequest(system, messages, model = "claude-3-5-sonnet-latest") {
    const message = await anthropicClient.messages.create({ max_tokens: 1024, messages, model, system });
    let output = message.content[0].text
    console.log(chalk.blueBright(`\n${output}`));
    return output
}


// Change to support other models
async function generatePrompt(instructions, description, system_prompt) {
    try {
        let content = `${instructions} for an AI agent based on the following description.\n\nDescription: '${description}'\n\nDo the best you can even if its hard. Simply respond with the best output you can. Simply return the string of the prompt.\n`

        if (selectedProvider === 'openai') {
            let resp = await makeOpenAIRequest([{ role: "system", content: system_prompt }, { role: "user", content }])
            return resp
        } else if (selectedProvider === 'anthropic') {
            let resp = await makeClaudeRequest(system_prompt, [{ role: "user", content }])
            return resp
        } else {
            let resp = await makeGaiaNetRequest([{ role: "system", content: system_prompt }, { role: "user", content }])
            return resp.choices[0].message.content
        }

    } catch (error) {
        console.error(`Provider: ${selectedProvider} failed: ${error}`);
        process.exit(0)
    }
}

// Change to support other models
async function generate_with_format_example(instructions, description, system_prompt, format_example) {
    let content = `${instructions} for an AI agent based on the following description.\n\nDescription: '${description}' \n\nUse the following format as an example: ${format_example}\n\nDo the best you can even if its hard. Simply respond with the best output you can. Simply return the string of the prompt.\n`
    //console.log(content)
    if (selectedProvider === 'openai') {
        let resp = await makeOpenAIRequest([{ role: "system", content: system_prompt }, {
            role: "user", content
        }])
        return resp
    } else if (selectedProvider === 'anthropic') {
        let resp = await makeClaudeRequest(system_prompt, [{ role: "user", content }])
        return resp
    } else {
        let resp = await makeGaiaNetRequest([{ role: "system", content: system_prompt }, {
            role: "user", content
        }])
        return resp.choices[0].message.content
    }
}

async function generate_system_prompt(agent_description) {
    console.log(chalk.green('\nGenerating system prompt...'));
    let output = await generatePrompt("Generate a short system prompt. Do not include quotation marks.", agent_description, "You are an elite programmer.")
    output = output.replace(/^"|"$/g, '')
    return output
}

async function generate_bio(agent_description) {
    let example = `[
        "hot takes specialist with no filter. lives for chaos, debates, and stirring the pot. if you're not mad, he's not doing his job.",
        "professional pot-stirrer who loves bold claims and wild predictions. thinks he's right 100% of the time, even when he's not.",
        "will defend his takes to the grave. loves nba drama almost as much as the games. unapologetically confident, always entertaining."
    ]`
    console.log(chalk.green('\nGenerating bio...'));
    let output = await generate_with_format_example("Generate an array of 5 bios", agent_description, "You are an elite programmer.", example)
    return output
}

async function generate_lore(agent_description) {
    let example = `[
        "once claimed that russell westbrook would win mvp again and got ratioed by the entire in,ternet.",
        "famously predicted lebron would miss the playoffs in 2019 and never let anyone forget he was right.",
        "called kawhi leonard 'overrated' on live tv and nearly got kicked off the set.",
    ]`
    console.log(chalk.green('\nGenerating lore...'));
    let output = await generate_with_format_example("Generate an array of 5 lore descriptions as strings", agent_description, "You are an elite programmer.", example)
    return output
}

async function generate_message_examples(agent_description, agent_name) {
    let example = `[
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "what's your take on zion this season?"
                }
            },
            {
                "user": "${agent_name}",
                "content": {
                    "text": "zion's gonna average 28 and 10 this year, no debate. health isn't an issue anymore. book it."
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "who's the real mvp right now?"
                }
            },
            {
                "user": "${agent_name}",
                "content": {
                    "text": "it's jokic and it's not even close. anyone saying otherwise is just salty."
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "what's your take on the lakers this year?"
                }
            },
            {
                "user": "${agent_name}",
                "content": {
                    "text": "if the lakers don't make the western conference finals, it's a failure. no excuses."
                }
            }
        ]
    ]`
    console.log(chalk.green('\nGenerating message examples...'));
    let output = await generate_with_format_example("Generate an array of a short conversations with the same format as the description. Be sure to only return the array of conversations. Do not include any other text.", agent_description, "You are an elite programmer.", example)
    return output
}

async function generate_post_examples(agent_description) {
    let example = `[
        "zion's winning mvp in the next two years. if you don't see it, you're blind.",
        "jokic is already a top 10 player of all time. the rings are coming, just wait.",
        "if curry gets one more ring, he's officially top 5 all time. no debate.",
        "kyrie irving is the most skilled point guard in nba history. respect the handles."
    ]`
    console.log(chalk.green('\nGenerating post examples...'));
    let output = await generate_with_format_example("Generate an array of 5 twitterpost examples", agent_description, "You are an elite programmer.", example)
    return output
}

async function generate_adjectives(agent_description) {
    let example = `[
        "bold",
        "chaotic",
        "unapologetic",
        "confident",
        "spicy"
    ]`
    console.log(chalk.green('\nGenerating adjectives...'));
    let output = await generate_with_format_example("Generate an array of 5 adjectives", agent_description, "You are an elite programmer.", example)
    return output
}

async function generate_topics(agent_description) {
    let example = `[
        "nba",
        "sports",
        "music",
        "movies",
        "tv"
    ]`
    console.log(chalk.green('\nGenerating topics...'));
    let output = await generate_with_format_example("Generate an array of 5 topics", agent_description, "You are an elite programmer.", example)
    return output
}

async function generate_style(agent_description) {
    let example = `{
            "all": [
        "use lowercase only",
            "never use hashtags or emojis",
            "make takes bold and debate-worthy",
            "keep responses short, punchy, and unapologetic",
            "don't hedge your bets—commit to your take",
            "be confident, even if it's ridiculous",
            "never sound apologetic or uncertain",
            "focus on starting conversations or arguments",
            "don't sugarcoat opinions—say what needs to be said",
            "embrace chaos and keep it fun",
            "act like a sports pundit who thrives on controversy"
    ],
    "chat": [
        "answer with bold opinions, not safe guesses",
        "don't dodge questions—commit to the spiciest take",
        "be unfiltered but not mean",
        "never admit you're wrong unless it's funny",
        "respond like you're on a debate show"
    ],
        "post": [
            "focus on bold predictions or spicy takes",
            "make statements that spark debate or reactions",
            "never explain yourself too much—let the take stand",
            "always sound confident, even if it's outlandish",
            "aim to entertain, not just inform"
        ]
    }`
    console.log(chalk.green('\nGenerating style...'));
    let output = await generate_with_format_example("Generate an javascript object with 3 keys. all, chat, and post. each key should have an array of strings as values. Be sure to only return the object. Do not include any other text.", agent_description, "You are an elite programmer.", example)
    return output
}


async function get_charcter_file_data(agent_description) {
    let generated_system_data = await generate_system_prompt(agent_description)
    await sleep(10)
    let generated_bio_data = await generate_bio(agent_description)
    await sleep(10)
    let generated_lore_data = await generate_lore(agent_description)
    await sleep(10)
    let generated_message_examples = await generate_message_examples(agent_description, "my_agent")
    await sleep(10)
    let generated_post_examples = await generate_post_examples(agent_description)
    await sleep(10)
    let generated_adjectives = await generate_adjectives(agent_description)
    await sleep(10)
    let generated_topics = await generate_topics(agent_description)
    await sleep(10)
    let generated_style = await generate_style(agent_description)

    /*
    console.log(chalk.blueBright(`\nSystem Prompt: ${generated_system_data} `));
    console.log(chalk.blueBright(`\n\nBio: ${generated_bio_data} `));
    console.log(chalk.blueBright(`\n\nLore: ${generated_lore_data} `));
    console.log(chalk.blueBright(`\n\nMessage Examples: ${generated_message_examples} `));
    console.log(chalk.blueBright(`\n\nPost Examples: ${generated_post_examples} `));
    console.log(chalk.blueBright(`\n\nAdjectives: ${generated_adjectives} `));
    console.log(chalk.blueBright(`\n\nTopics: ${generated_topics} `));
    console.log(chalk.blueBright(`\n\nStyle: ${generated_style} `));
    */
    return {
        system: generated_system_data,
        bio: generated_bio_data,
        lore: generated_lore_data,
        messageExamples: generated_message_examples,
        postExamples: generated_post_examples,
        adjectives: generated_adjectives,
        topics: generated_topics,
        style: generated_style
    }
}

async function generate_character_file(agent_description, file_path) {
    let { system, bio, lore, messageExamples, postExamples, adjectives, topics, style } = await get_charcter_file_data(agent_description)
    let included_clients = agentType === 'Create Twitter Agent' ? `"twitter"` : ""
    let model_provider = ""

    if (selectedProvider === 'cancel') {
        model_provider = 'gaianet'
    } else {
        model_provider = selectedProvider
    }

    let character_file = `{
    "name": "${agentName}",
    "clients": [${included_clients}],
    "modelProvider": "${model_provider}",
    "settings": {
        "voice": {
            "model": "en_GB-alan-medium"
        }
    },
    "plugins": [],
    "system": "${system}",
    "bio": ${bio},
    "lore": ${lore},
    "knowledge": [],
    "messageExamples": ${messageExamples},
    "postExamples": ${postExamples},
    "topics": ${topics},
    "style": ${style},
    "adjectives": ${adjectives}
    }`

    try {
        writeFileSync(file_path, character_file, 'utf8');
        console.log(chalk.green('Successfully wrote character file.'));
    } catch (error) {
        console.error(chalk.red(`Failed to write character file: ${error}`));
        throw error;
    }
}

function createTwitterEnvTemplate(username, password, email) {
    let result = envTemplate.replace(
        /TWITTER_USERNAME=.*\nTWITTER_PASSWORD=.*\nTWITTER_EMAIL=.*/,
        `TWITTER_USERNAME=${username}\nTWITTER_PASSWORD=${password}\nTWITTER_EMAIL=${email}`
    );
    envTemplate = result
    return result
}

function createOpenEnvTemplate(api_key) {
    if (selectedProvider === 'openai') {
        return envTemplate.replace(
            /OPENAI_API_KEY=.*\n/,
            `OPENAI_API_KEY=${api_key}\n`
        );
    } else if (selectedProvider === 'anthropic') {
        return envTemplate.replace(
            /ANTHROPIC_API_KEY=.*\n/,
            `ANTHROPIC_API_KEY=${api_key}\n`
        );
    } else if (selectedProvider === 'claude_vertex') {
        return envTemplate.replace(
            /CLAUDE_API_KEY=.*\n/,
            `CLAUDE_API_KEY=${api_key}\n`
        );
    }
}

function writeEnvFile(content, filepath = 'test.env') {
    try {
        writeFileSync(filepath, content, 'utf8');
    } catch (error) {
        throw new Error(`Failed to write env file: ${error} `);
    }
}

async function sendMessageToAgent(agentName, message = "Hello, how are you today?") {
    try {
        const response = await fetch(`http://localhost:3000/${agentName}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Agent: " + chalk.green(`${data[0].text}`));
        //console.log(data);
        return data.text;
    } catch (error) {
        console.error(chalk.red('Error sending message:', error.message));
        throw error;
    }
}

async function handleMessage(selectedAgent) {
    // Get the message from the user
    const messageAnswer = await inquirer.prompt({
        name: 'message',
        type: 'input',
        message: 'Enter your message:',
        /*
        validate(input) {
            return input.length > 0 ? true : 'Message cannot be empty';
        }*/
    });

    // Send the message
    if (messageAnswer.message.length > 0) {
        //let spinner = createSpinner('Agent is typing...').start();
        await sendMessageToAgent(selectedAgent, messageAnswer.message);
        //spinner.success({ text: 'Message received.' });
        handleMessage(selectedAgent);
    } else {
        //console.log(chalk.red('Message cannot be empty'));
        await showMainMenu();
    }
}
async function sendMessageToAgentMenu() {
    const agentsDir = 'agents';

    // Check if agents directory exists
    if (!existsSync(agentsDir)) {
        console.log(chalk.red('\nNo agents directory found.'));
        await showMainMenu();
        return;
    }

    try {
        // Get list of agent folders
        let agents = readdirSync(path.join(agentsDir, 'characters'), { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name)
            .filter(name => name.endsWith('.character.json'))
            .map(name => name.split('.')[0]);

        if (agents.length === 0) {
            console.log(chalk.yellow('\nNo agents found. Create an agent first.'));
            await showMainMenu();
            return;
        }

        agents.push("Back to Main Menu");

        // Let user select an agent
        const agentAnswer = await inquirer.prompt({
            name: 'selectedAgent',
            type: 'list',
            message: 'Select an agent to message:',
            choices: agents
        });

        if (agentAnswer.selectedAgent === "Back to Main Menu") {
            await showMainMenu();
            return;
        }

        handleMessage(agentAnswer.selectedAgent);

        /*
        // Ask if they want to send another message or return to main menu
        const continueAnswer = await inquirer.prompt({
            name: 'action',
            type: 'list',
            message: 'What would you like to do next?',
            choices: [
                'Send Another Message',
                'Return to Main Menu'
            ]
        });
        */

        /*
        if (continueAnswer.action === 'Send Another Message') {
            await sendMessageToAgentMenu();
        } else {
            await showMainMenu();
        }*/

    } catch (error) {
        console.error(chalk.red('Error:', error.message));
        await showMainMenu();
    }
}

startApp();


