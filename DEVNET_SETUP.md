# Devnet Setup Guide

Complete guide to run the NFT marketplace on Solana Devnet for free.

## Prerequisites

1. **Solana CLI** installed and configured for devnet
2. **Anchor** installed
3. **Wallet** (Phantom or Solflare) configured for devnet

## Step 1: Configure Solana CLI for Devnet

```bash
# Set Solana CLI to devnet
solana config set --url https://api.devnet.solana.com

# Check your configuration
solana config get

# Generate a new keypair if needed (or use existing)
solana-keygen new

# Get your public key
solana address
```

## Step 2: Get Free Devnet SOL

```bash
# Airdrop 2 SOL (you can request multiple times)
solana airdrop 2

# Check your balance
solana balance
```

**Alternative**: Use the web faucet:
- Visit: https://faucet.solana.com/
- Enter your wallet address
- Request devnet SOL

## Step 3: Deploy Program to Devnet

```bash
# Build the program
anchor build

# Deploy to devnet (requires devnet SOL in your keypair)
anchor deploy --provider.cluster devnet

# Note the program ID from deployment
# Update Anchor.toml if program ID changes
```

## Step 4: Update Anchor.toml for Devnet

Add devnet configuration:

```toml
[programs.devnet]
marketplace = "Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6"

[provider]
cluster = "devnet"
wallet = '~/.config/solana/id.json'
```

## Step 5: Get Test NFTs

### Option A: Create Test NFT with Metaplex

```bash
# Install Metaplex CLI (if not installed)
npm install -g @metaplex-foundation/metaplex-cli

# Create a test NFT
metaplex create-nft \
  --keypair ~/.config/solana/id.json \
  --network devnet \
  --name "Test NFT" \
  --symbol "TEST" \
  --uri "https://example.com/metadata.json"
```

### Option B: Use Existing Devnet NFT

If you have an NFT mint address on devnet, you can use it directly.

### Option C: Mint Test Token (Simpler)

```bash
# Create a test SPL token (can be used as NFT)
spl-token create-token --decimals 0

# Mint 1 token to yourself
spl-token create-account <TOKEN_MINT>
spl-token mint <TOKEN_MINT> 1
```

## Step 6: Configure Frontend RPC (Optional)

The frontend connects directly to Solana RPC. If you need to use a custom RPC endpoint:

```bash
cd app
echo "VITE_SOLANA_RPC_URL=https://api.devnet.solana.com" > .env.local
```

**Note**: If you hit rate limits, see `RPC_OPTIONS.md` for free alternatives.

## Step 7: Configure Wallet for Devnet

### Phantom Wallet:
1. Open Phantom
2. Click settings (gear icon)
3. Go to "Developer Settings"
4. Enable "Testnet Mode" or switch network to "Devnet"

### Solflare Wallet:
1. Open Solflare
2. Click network selector
3. Select "Devnet"

## Step 8: Start Frontend

The frontend is already configured for devnet. Just start it:

```bash
cd app
npm run dev
```

## Step 9: Test the Marketplace

1. **Connect Wallet**: Open http://localhost:3000 and connect your devnet wallet
2. **Get Devnet SOL**: Use faucet if needed (see Step 2)
3. **Create Listing**: 
   - Click "Create Listing"
   - Enter your NFT mint address
   - Set price (e.g., 0.1 SOL)
   - Set royalty (e.g., 500 for 5%)
   - Submit transaction
4. **Test Purchase**: Use another wallet or account to test buying

## Troubleshooting

### "Insufficient funds" error
- Request more devnet SOL: `solana airdrop 2`
- Or use web faucet: https://faucet.solana.com/

### "Program not found" error
- Make sure program is deployed: `anchor deploy --provider.cluster devnet`
- Check program ID matches in Anchor.toml

### "Account not found" errors
- Ensure you own the NFT
- Check NFT is in your wallet's associated token account
- Verify you're on devnet network

### RPC connection errors
- Verify RPC endpoint is accessible
- Check browser console for connection errors
- Try switching to a different RPC provider (see RPC_OPTIONS.md)

## Quick Commands Reference

```bash
# Switch to devnet
solana config set --url https://api.devnet.solana.com

# Get devnet SOL
solana airdrop 2

# Deploy program
anchor deploy --provider.cluster devnet

# Check balance
solana balance

# View program logs
anchor logs
```

## Cost

Everything on devnet is **FREE**:
- ✅ Devnet SOL (unlimited via faucet)
- ✅ Program deployment (free)
- ✅ Transactions (free)
- ✅ Account creation (free)

Perfect for testing and development!
