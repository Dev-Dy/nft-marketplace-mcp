#!/bin/bash
# Start marketplace on devnet

set -e

echo "🚀 Starting NFT Marketplace on Devnet..."

# Check if Solana CLI is configured for devnet
CURRENT_CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [[ "$CURRENT_CLUSTER" != *"devnet"* ]]; then
    echo "⚠️  Warning: Solana CLI is not set to devnet"
    echo "   Current RPC: $CURRENT_CLUSTER"
    echo "   Run: solana config set --url https://api.devnet.solana.com"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check balance
BALANCE=$(solana balance --lamports 2>/dev/null | awk '{print $1}' || echo "0")
if [ "$BALANCE" -lt 1000000000 ]; then
    echo "💰 Requesting devnet SOL airdrop..."
    solana airdrop 2
    sleep 2
fi

echo "✅ Devnet configuration ready"
echo ""

# Start MCP HTTP bridge
echo "📡 Starting MCP HTTP bridge (devnet)..."
cd mcp-server-http

# Use custom RPC if provided, otherwise use public devnet
RPC_URL=${SOLANA_RPC_URL:-https://api.devnet.solana.com}
echo "   Using RPC: $RPC_URL"

MCP_BINARY=../mcp/target/release/marketplace-mcp \
SOLANA_RPC_URL=$RPC_URL \
cargo run --release &
MCP_PID=$!
cd ..

sleep 3

# Start frontend
echo "🌐 Starting frontend..."
cd app

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "   Creating .env.local..."
    echo "VITE_SOLANA_RPC_URL=https://api.devnet.solana.com" > .env.local
    echo "VITE_MCP_API_URL=http://localhost:8080" >> .env.local
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "   Installing dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services started!"
echo ""
echo "📋 Service Information:"
echo "   - MCP HTTP Bridge: http://localhost:8080 (PID: $MCP_PID)"
echo "   - Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "   - RPC: https://api.devnet.solana.com"
echo ""
echo "🛑 To stop services:"
echo "   kill $MCP_PID $FRONTEND_PID"
echo ""
echo "📖 See DEVNET_SETUP.md for complete setup guide"

wait
