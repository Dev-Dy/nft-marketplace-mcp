#!/bin/bash
# Mint test NFTs to your wallet on devnet

set -e

WALLET_ADDRESS=$(solana address)
echo "🎨 Minting test NFTs for wallet: $WALLET_ADDRESS"
echo ""

# Check if spl-token is installed
if ! command -v spl-token &> /dev/null; then
    echo "❌ spl-token CLI not found"
    echo ""
    echo "Install it with:"
    echo "  cargo install spl-token-cli"
    echo ""
    echo "Or use Solana CLI tools:"
    echo "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Number of NFTs to mint (default: 3)
NUM_NFTS=${1:-3}

echo "📦 Creating $NUM_NFTS test NFTs..."
echo ""

# Create array to store mint addresses
declare -a MINT_ADDRESSES=()

for i in $(seq 1 $NUM_NFTS); do
    echo "Creating NFT #$i..."
    
    # Create token with 0 decimals (NFT requirement)
    MINT_OUTPUT=$(spl-token create-token --decimals 0 2>&1)
    MINT_ADDRESS=$(echo "$MINT_OUTPUT" | grep -oP 'Creating token \K[1-9A-HJ-NP-Za-km-z]{32,44}')
    
    if [ -z "$MINT_ADDRESS" ]; then
        # Try alternative parsing
        MINT_ADDRESS=$(echo "$MINT_OUTPUT" | tail -1 | awk '{print $NF}')
    fi
    
    if [ -z "$MINT_ADDRESS" ]; then
        echo "❌ Failed to parse mint address for NFT #$i"
        continue
    fi
    
    echo "  Mint address: $MINT_ADDRESS"
    MINT_ADDRESSES+=("$MINT_ADDRESS")
    
    # Create associated token account
    echo "  Creating token account..."
    spl-token create-account "$MINT_ADDRESS" 2>&1 | grep -v "already exists" || true
    
    # Mint 1 token (NFT)
    echo "  Minting 1 token..."
    spl-token mint "$MINT_ADDRESS" 1 2>&1 | grep -v "already exists" || true
    
    echo "  ✅ NFT #$i created"
    echo ""
done

echo "🎉 Successfully created $NUM_NFTS test NFTs!"
echo ""
echo "📋 Mint Addresses:"
for i in "${!MINT_ADDRESSES[@]}"; do
    echo "  NFT #$((i+1)): ${MINT_ADDRESSES[$i]}"
done
echo ""
echo "💡 You can now use these NFTs in the marketplace!"
echo "   Open the frontend and create listings with these mint addresses."
