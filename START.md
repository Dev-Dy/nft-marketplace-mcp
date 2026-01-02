# Quick Start Guide

Get the NFT marketplace up and running quickly.

## Prerequisites

- Node.js 18+
- Rust & Cargo
- Solana CLI
- Anchor CLI
- A Solana wallet (Phantom, Solflare, etc.)

## Quick Start (Devnet)

### Option 1: Use the start script

```bash
./scripts/start-devnet.sh
```

This will:
- ✅ Start the frontend on http://localhost:5173
- ✅ Configure Solana CLI for devnet

### Option 2: Manual start

#### Step 1: Start Frontend

```bash
cd app
npm install
npm run dev
```

The frontend will run on: **http://localhost:5173**

## Quick Start (Local Validator)

### Option 1: Use the start script

```bash
./scripts/start-local.sh
```

This will:
- ✅ Start local Solana validator
- ✅ Start the frontend
- ✅ Airdrop SOL to default keypair

### Option 2: Manual start

#### Step 1: Start Local Validator

```bash
solana-test-validator --reset
```

#### Step 2: Configure for Localhost

```bash
solana config set --url localhost
solana airdrop 10
```

#### Step 3: Deploy Program

```bash
./scripts/deploy.sh
```

#### Step 4: Start Frontend

```bash
cd app
npm install
npm run dev
```

## Usage

1. **Connect Wallet**: Click "Connect Wallet" in the top right
2. **Create Listing**: Navigate to "Create Listing" and select an NFT
3. **View Listings**: Browse active listings on the home page
4. **Purchase**: Click on a listing to view details and purchase

## Troubleshooting

### Frontend won't start
- Check Node.js version: `node --version` (should be 18+)
- Reinstall dependencies: `cd app && rm -rf node_modules && npm install`

### Wallet connection issues
- Make sure your wallet is set to the correct network (devnet/mainnet)
- Try disconnecting and reconnecting your wallet

### Transaction failures
- Check you have enough SOL for transaction fees
- Verify the program is deployed: `anchor keys list`

### Program not found
- Deploy the program: `./scripts/deploy.sh`
- Check program ID matches in `app/src/lib/anchor.ts`

## Next Steps

- See `DEPLOY.md` for production deployment
- See `DEVNET_SETUP.md` for detailed devnet configuration
