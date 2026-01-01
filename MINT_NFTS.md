# Mint Test NFTs for Devnet

## Quick Mint (Recommended)

```bash
./scripts/mint-test-nfts.sh
```

This will mint 3 test NFTs by default. To mint a different number:

```bash
./scripts/mint-test-nfts.sh 5  # Mint 5 NFTs
```

## Manual Minting

### Option 1: Using SPL Token CLI (Simplest)

```bash
# Install spl-token if needed
cargo install spl-token-cli

# Or use Solana CLI (includes spl-token)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Create NFT token (0 decimals)
spl-token create-token --decimals 0

# Note the mint address from output, then:
MINT_ADDRESS=<your_mint_address>

# Create token account
spl-token create-account $MINT_ADDRESS

# Mint 1 token (NFT)
spl-token mint $MINT_ADDRESS 1

# Verify
spl-token accounts
```

### Option 2: Using Metaplex (More Realistic)

```bash
# Install Metaplex CLI
npm install -g @metaplex-foundation/metaplex-cli

# Create NFT with metadata
metaplex create-nft \
  --keypair ~/.config/solana/id.json \
  --network devnet \
  --name "Test NFT #1" \
  --symbol "TEST" \
  --uri "https://example.com/metadata.json"
```

### Option 3: Using Anchor Program

If you have a custom NFT minting program, you can use it to create NFTs.

## Verify Your NFTs

```bash
# List all your token accounts
spl-token accounts

# Check specific token account
spl-token account-info <token_account_address>
```

## Using NFTs in Marketplace

1. **Open Frontend**: http://localhost:5173
2. **Connect Wallet**: Your wallet should show the NFTs
3. **Create Listing**: 
   - Click "Create Listing"
   - Select an NFT from the grid
   - Set price and royalty
   - Submit transaction

## Troubleshooting

### "spl-token: command not found"
```bash
# Install via cargo
cargo install spl-token-cli

# Or install Solana CLI (includes spl-token)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### "Insufficient funds"
```bash
# Get devnet SOL
solana airdrop 2

# Or use web faucet
# https://faucet.solana.com/
```

### NFTs not showing in frontend
- Ensure wallet is connected
- Check you're on devnet network
- Verify NFTs are in the connected wallet
- Refresh the page

## NFT Requirements

For an SPL token to be considered an NFT:
- **Decimals**: 0
- **Supply**: 1 token
- **Frozen**: Usually frozen after minting

The marketplace filters for:
- `amount === 1`
- `decimals === 0`

## Example Mint Addresses

After minting, you'll get addresses like:
```
NFT #1: 7Ygg...abc123
NFT #2: 9Xhh...def456
NFT #3: 5Zjj...ghi789
```

Save these addresses - you'll need them for testing!
