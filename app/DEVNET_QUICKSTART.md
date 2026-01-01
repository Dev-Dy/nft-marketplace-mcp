# Quick Start: Devnet (Free)

## 1. Switch to Devnet

```bash
solana config set --url https://api.devnet.solana.com
```

## 2. Get Free Devnet SOL

```bash
solana airdrop 2
```

Or use web faucet: https://faucet.solana.com/

## 3. Deploy Program (if not already deployed)

```bash
anchor deploy --provider.cluster devnet
```

## 4. Start Services

```bash
# Terminal 1: MCP Server (devnet)
cd mcp-server-http
MCP_BINARY=../mcp/target/release/marketplace-mcp \
SOLANA_RPC_URL=https://api.devnet.solana.com \
cargo run --release

# Terminal 2: Frontend
cd app
npm run dev
```

## 5. Configure Wallet

- **Phantom**: Settings → Developer Settings → Enable Testnet Mode
- **Solflare**: Switch network to Devnet

## 6. Get Test NFT

You need an NFT to list. Options:

**Option A: Create test token**
```bash
spl-token create-token --decimals 0
spl-token create-account <TOKEN_MINT>
spl-token mint <TOKEN_MINT> 1
```

**Option B: Use existing devnet NFT**
- If you have an NFT mint address on devnet, use it directly

## 7. Use the Marketplace

1. Open http://localhost:3000
2. Connect your devnet wallet
3. Click "Create Listing"
4. Enter NFT mint address
5. Set price and royalty
6. Submit!

## Everything is FREE on Devnet! 🎉
