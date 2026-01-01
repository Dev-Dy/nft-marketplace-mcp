# 🚀 Starting the NFT Marketplace

## Quick Start (After Deployment)

### Option 1: Automated Startup Script (Recommended)

```bash
./scripts/start-devnet.sh
```

This will:
- ✅ Start MCP HTTP bridge
- ✅ Start frontend dev server
- ✅ Configure devnet RPC URLs

### Option 2: Manual Startup

#### Step 1: Start MCP HTTP Bridge

```bash
cd mcp-server-http
MCP_BINARY=../mcp/target/release/marketplace-mcp \
SOLANA_RPC_URL=https://api.devnet.solana.com \
cargo run --release
```

The MCP server will run on: **http://localhost:8080**

#### Step 2: Start Frontend (New Terminal)

```bash
cd app

# Create .env file if it doesn't exist
cat > .env.local << EOF
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_MCP_API_URL=http://localhost:8080
EOF

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

The frontend will run on: **http://localhost:5173** (or similar)

## Service URLs

- **Frontend**: http://localhost:5173
- **MCP HTTP Bridge**: http://localhost:8080
- **Solana RPC**: https://api.devnet.solana.com
- **Program ID**: `Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6`

## Verification

1. **Check Program Deployment**:
   ```bash
   solana program show Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6
   ```

2. **Test MCP Server**:
   ```bash
   curl http://localhost:8080/health
   ```

3. **Open Frontend**:
   - Navigate to http://localhost:5173
   - Connect your wallet (Phantom/Solflare)
   - You should see the marketplace interface

## Troubleshooting

### MCP Server Won't Start
- Check if port 8080 is available: `lsof -i :8080`
- Verify MCP binary exists: `ls -la mcp/target/release/marketplace-mcp`
- Rebuild if needed: `cd mcp && cargo build --release`

### Frontend Can't Connect
- Check `.env.local` file exists in `app/` directory
- Verify MCP server is running: `curl http://localhost:8080/health`
- Check browser console for errors

### Rate Limits
- Use free RPC providers (see `RPC_OPTIONS.md`)
- Or use local validator (see `scripts/start-local.sh`)

## Next Steps

1. **Get Test NFTs**: Use devnet NFT minters or create test tokens
2. **Create Listings**: Connect wallet → Select NFT → Set price → List
3. **Test Trading**: Fund escrow → Settle trade → Verify NFT transfer

## Stopping Services

Press `Ctrl+C` in each terminal, or:

```bash
# Find and kill processes
pkill -f "marketplace-mcp"
pkill -f "vite"
```
