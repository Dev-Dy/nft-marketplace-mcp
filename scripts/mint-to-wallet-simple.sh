#!/bin/bash
# Simple script to mint NFTs to a wallet address

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <wallet_address> [number_of_nfts]"
    exit 1
fi

WALLET_ADDRESS=$1
NUM_NFTS=${2:-3}

echo "🎨 Minting $NUM_NFTS NFTs to: $WALLET_ADDRESS"
echo ""

# Initialize account if needed
echo "🔍 Checking account..."
if ! solana account "$WALLET_ADDRESS" &>/dev/null; then
    echo "   Initializing account..."
    solana transfer "$WALLET_ADDRESS" 0.001 --allow-unfunded-recipient
    sleep 2
fi

declare -a MINT_ADDRESSES=()

for i in $(seq 1 $NUM_NFTS); do
    echo "NFT #$i:"
    
    # Create token
    MINT_OUTPUT=$(spl-token create-token --decimals 0 2>&1)
    MINT=$(echo "$MINT_OUTPUT" | grep -oE '[1-9A-HJ-NP-Za-km-z]{32,44}' | tail -1)
    
    if [ -z "$MINT" ]; then
        echo "  ❌ Failed to create token"
        continue
    fi
    
    echo "  Mint: $MINT"
    MINT_ADDRESSES+=("$MINT")
    
    # Create account and mint in one go (spl-token handles ATA automatically)
    echo "  Creating account and minting..."
    spl-token create-account "$MINT" --owner "$WALLET_ADDRESS" && \
    spl-token mint "$MINT" 1 "$WALLET_ADDRESS" && \
    echo "  ✅ Success" || echo "  ⚠️  Check manually"
    
    echo ""
done

echo "📋 Minted NFTs:"
for i in "${!MINT_ADDRESSES[@]}"; do
    echo "  NFT #$((i+1)): ${MINT_ADDRESSES[$i]}"
done
