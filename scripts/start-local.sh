#!/bin/bash
# Start marketplace with local validator (no rate limits)

set -e

echo "🚀 Starting NFT Marketplace with Local Validator..."

# Check if validator is running
if ! pgrep -f "solana-test-validator" > /dev/null; then
    echo "⚠️  Local validator not running"
    echo "   Starting validator in background..."
    solana-test-validator > /dev/null 2>&1 &
    VALIDATOR_PID=$!
    echo "   Validator started (PID: $VALIDATOR_PID)"
    sleep 5
else
    echo "✅ Local validator already running"
fi

# Deploy program if needed
echo "📦 Checking program deployment..."
if ! solana program show Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6 > /dev/null 2>&1; then
    echo "   Deploying program..."
    anchor deploy
else
    echo "   Program already deployed"
fi

# Start MCP HTTP bridge
echo "📡 Starting MCP HTTP bridge (local)..."
cd mcp-server-http
MCP_BINARY=../mcp/target/release/marketplace-mcp \
SOLANA_RPC_URL=http://localhost:8899 \
cargo run --release &
MCP_PID=$!
cd ..

sleep 3

# Start frontend
echo "🌐 Starting frontend..."
cd app
# Create .env for local RPC
echo "VITE_SOLANA_RPC_URL=http://localhost:8899" > .env.local
echo "VITE_MCP_API_URL=http://localhost:8080" >> .env.local
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services started!"
echo ""
echo "📋 Service Information:"
echo "   - Local Validator: http://localhost:8899"
echo "   - MCP HTTP Bridge: http://localhost:8080 (PID: $MCP_PID)"
echo "   - Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "💰 Get SOL: solana airdrop 2"
echo ""
echo "🛑 To stop services:"
echo "   kill $MCP_PID $FRONTEND_PID"
echo "   pkill -f solana-test-validator"

wait
