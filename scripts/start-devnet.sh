#!/bin/bash
# Start devnet environment: local validator + frontend

set -e

echo "🚀 Starting NFT Marketplace on Devnet..."

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

# Set to devnet
echo "📡 Configuring for devnet..."
solana config set --url devnet

# Start frontend
echo "🎨 Starting frontend..."
cd app
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for servers to start
sleep 2

echo ""
echo "✅ Development environment started!"
echo ""
echo "📋 Services running:"
echo "   - Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "💡 Tips:"
echo "   - Connect your wallet to devnet in the browser"
echo "   - Make sure you have devnet SOL for transactions"
echo "   - Check browser console for any errors"
echo ""
echo "🛑 To stop all services:"
echo "   kill $FRONTEND_PID"
