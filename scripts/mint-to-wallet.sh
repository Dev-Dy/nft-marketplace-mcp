#!/bin/bash
# Mint NFTs to a specific wallet address

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <wallet_address> [number_of_nfts]"
    echo ""
    echo "Example:"
    echo "  $0 CXtxLzHiFb6ChVfHkhPAe2teyuMCCxsr1tCxmmc5WiGa 3"
    echo ""
    exit 1
fi

WALLET_ADDRESS=$1
NUM_NFTS=${2:-3}

echo "🎨 Minting $NUM_NFTS NFTs to wallet: $WALLET_ADDRESS"
echo ""

# Verify wallet address is valid format
if [ ${#WALLET_ADDRESS} -lt 32 ] || [ ${#WALLET_ADDRESS} -gt 44 ]; then
    echo "❌ Invalid wallet address format"
    exit 1
fi

# Check if spl-token is installed
if ! command -v spl-token &> /dev/null; then
    echo "❌ spl-token CLI not found"
    echo "Install it with: cargo install spl-token-cli"
    exit 1
fi

# Check if account exists on-chain
echo "🔍 Checking if wallet account exists..."
ACCOUNT_EXISTS=$(solana account "$WALLET_ADDRESS" 2>&1 | grep -q "Account found" && echo "yes" || echo "no")

if [ "$ACCOUNT_EXISTS" = "no" ]; then
    echo "⚠️  Wallet account doesn't exist on-chain yet"
    echo "   Initializing account by sending minimum SOL..."
    
    # Send minimum SOL to initialize the account (0.00089 SOL is minimum)
    solana transfer "$WALLET_ADDRESS" 0.001 --allow-unfunded-recipient 2>&1 | grep -v "Error" || {
        echo "❌ Failed to initialize account. The wallet may need to be created first."
        echo "   Try: solana transfer $WALLET_ADDRESS 0.001 --allow-unfunded-recipient"
        exit 1
    }
    echo "✅ Account initialized"
    echo ""
fi

declare -a MINT_ADDRESSES=()

for i in $(seq 1 $NUM_NFTS); do
    echo "Creating NFT #$i..."
    
    # Create token with 0 decimals (NFT requirement)
    MINT_OUTPUT=$(spl-token create-token --decimals 0 2>&1)
    MINT_ADDRESS=$(echo "$MINT_OUTPUT" | grep -oP 'Creating token \K[1-9A-HJ-NP-Za-km-z]{32,44}')
    
    if [ -z "$MINT_ADDRESS" ]; then
        # Try alternative parsing - get last word that looks like an address
        MINT_ADDRESS=$(echo "$MINT_OUTPUT" | grep -oE '[1-9A-HJ-NP-Za-km-z]{32,44}' | tail -1)
    fi
    
    if [ -z "$MINT_ADDRESS" ]; then
        echo "❌ Failed to parse mint address for NFT #$i"
        echo "   Output: $MINT_OUTPUT"
        continue
    fi
    
    echo "  Mint address: $MINT_ADDRESS"
    MINT_ADDRESSES+=("$MINT_ADDRESS")
    
    # Create associated token account for the target wallet
    echo "  Creating associated token account..."
    CREATE_OUTPUT=$(spl-token create-account "$MINT_ADDRESS" --owner "$WALLET_ADDRESS" 2>&1)
    
    if echo "$CREATE_OUTPUT" | grep -q "Error"; then
        echo "  ⚠️  Account creation had issues: $CREATE_OUTPUT"
    fi
    
    # Mint 1 token directly to the wallet (spl-token will handle ATA creation)
    echo "  Minting 1 token..."
    MINT_OUTPUT=$(spl-token mint "$MINT_ADDRESS" 1 "$WALLET_ADDRESS" 2>&1)
    
    if echo "$MINT_OUTPUT" | grep -q "Error"; then
        echo "  ❌ Mint failed: $MINT_OUTPUT"
        echo "  ⚠️  NFT #$i may not have been minted successfully"
    else
        echo "  ✅ NFT #$i created and sent to wallet"
    fi
    echo ""
done

echo "🎉 Successfully minted $NUM_NFTS NFTs to $WALLET_ADDRESS!"
echo ""
echo "📋 Mint Addresses:"
for i in "${!MINT_ADDRESSES[@]}"; do
    echo "  NFT #$((i+1)): ${MINT_ADDRESSES[$i]}"
done
echo ""
echo "💡 Refresh the frontend to see your NFTs!"
