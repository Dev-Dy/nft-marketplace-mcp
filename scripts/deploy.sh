#!/bin/bash
# Deploy marketplace program to devnet

set -e

echo "🚀 Deploying NFT Marketplace to Devnet..."
echo ""

# Check if we're on devnet
CURRENT_RPC=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [[ "$CURRENT_RPC" != *"devnet"* ]]; then
    echo "⚠️  Not on devnet. Switching to devnet..."
    solana config set --url https://api.devnet.solana.com
    echo "✅ Switched to devnet"
    echo ""
fi

# Check balance
BALANCE=$(solana balance --lamports | awk '{print $1}')
MIN_BALANCE=2000000000  # 2 SOL in lamports

echo "💰 Current balance: $(solana balance)"
echo ""

if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
    echo "⚠️  Insufficient balance for deployment (need ~2 SOL)"
    echo ""
    echo "📝 Options to get devnet SOL:"
    echo "   1. Web faucet: https://faucet.solana.com/"
    echo "   2. CLI airdrop: solana airdrop 2"
    echo "   3. Alternative faucet: https://solfaucet.com/"
    echo ""
    echo "   After getting SOL, run this script again."
    exit 1
fi

# Build the program
echo "🔨 Building program..."
anchor build
echo "✅ Build complete"
echo ""

# Deploy
echo "📦 Deploying program..."
anchor deploy --provider.cluster devnet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Program Information:"
solana program show Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6
echo ""
echo "🌐 Next steps:"
echo "   1. Update frontend .env with devnet RPC URL (if needed)"
echo "   2. Start frontend: cd app && npm run dev"
