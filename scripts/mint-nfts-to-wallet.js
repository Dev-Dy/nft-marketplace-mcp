#!/usr/bin/env node
// Mint NFTs directly to a wallet address using @solana/web3.js

const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

const WALLET_ADDRESS = process.argv[2];
const NUM_NFTS = parseInt(process.argv[3]) || 3;

if (!WALLET_ADDRESS) {
    console.error('Usage: node mint-nfts-to-wallet.js <wallet_address> [number_of_nfts]');
    process.exit(1);
}

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Load CLI wallet as fee payer
const keypairPath = path.join(process.env.HOME, '.config', 'solana', 'id.json');
const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
const payer = Keypair.fromSecretKey(Uint8Array.from(keypairData));

const targetWallet = new PublicKey(WALLET_ADDRESS);

async function main() {
    console.log(`🎨 Minting ${NUM_NFTS} NFTs to: ${WALLET_ADDRESS}`);
    console.log(`📡 RPC: ${RPC_URL}`);
    console.log('');

    // Check if target wallet exists, initialize if needed
    try {
        await connection.getBalance(targetWallet);
    } catch (err) {
        console.log('⚠️  Initializing wallet account...');
        const signature = await connection.requestAirdrop(targetWallet, 0.001 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);
        console.log('✅ Account initialized\n');
    }

    const mintAddresses = [];

    for (let i = 1; i <= NUM_NFTS; i++) {
        console.log(`Creating NFT #${i}...`);
        
        try {
            // Create mint
            const mint = await createMint(
                connection,
                payer,
                payer.publicKey, // mint authority
                null, // freeze authority
                0 // decimals (NFT requirement)
            );
            
            console.log(`  Mint: ${mint.toString()}`);
            mintAddresses.push(mint.toString());

            // Get or create associated token account
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                payer,
                mint,
                targetWallet
            );

            // Mint 1 token
            await mintTo(
                connection,
                payer,
                mint,
                tokenAccount.address,
                payer, // mint authority
                1 // amount
            );

            console.log(`  ✅ NFT #${i} minted successfully`);
            console.log('');
        } catch (err) {
            console.error(`  ❌ Failed to mint NFT #${i}:`, err.message);
            console.log('');
        }
    }

    console.log('📋 Minted NFTs:');
    mintAddresses.forEach((addr, i) => {
        console.log(`  NFT #${i + 1}: ${addr}`);
    });
    console.log('');
    console.log('💡 Refresh the frontend to see your NFTs!');
}

main().catch(console.error);
