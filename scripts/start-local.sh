#!/bin/bash
# Start local environment: local validator + frontend

set -e

echo "🚀 Starting NFT Marketplace locally..."

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Error: solana CLI not found. Please install it first."
    exit 1
fi

# Check if anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Error: anchor CLI not found. Please install it first."
    exit 1
fi

# Start local validator
echo "🔗 Starting local Solana validator..."
solana-test-validator --reset --quiet &
VALIDATOR_PID=$!

# Wait for validator to be ready
echo "⏳ Waiting for validator to be ready..."
sleep 5

# Set to localhost
echo "📡 Configuring for localhost..."
solana config set --url localhost

# Airdrop SOL to default keypair
echo "💰 Airdropping SOL to default keypair..."
solana airdrop 10

# Start frontend
echo "🎨 Starting frontend..."
cd app
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for servers to start
sleep 2

echo ""
echo "✅ Local development environment started!"
echo ""
echo "📋 Services running:"
echo "   - Local Validator: http://localhost:8899 (PID: $VALIDATOR_PID)"
echo "   - Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "💡 Tips:"
echo "   - Deploy the program: ./scripts/deploy.sh"
echo "   - Connect your wallet to localhost in the browser"
echo "   - Check browser console for any errors"
echo ""
echo "🛑 To stop all services:"
echo "   kill $VALIDATOR_PID $FRONTEND_PID"
