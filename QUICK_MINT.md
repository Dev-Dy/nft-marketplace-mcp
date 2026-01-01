# Quick Mint NFTs to Your Wallet

## Step 1: Get Your Wallet Address

1. Open the frontend: http://localhost:5173
2. Connect your wallet (Phantom/Solflare)
3. Go to "Create Listing" page
4. Look at the wallet address shown in the UI (or check browser console)

## Step 2: Mint NFTs

Once you have your wallet address, run:

```bash
./scripts/mint-to-wallet.sh YOUR_WALLET_ADDRESS 3
```

Replace `YOUR_WALLET_ADDRESS` with the address from step 1.

## Example

```bash
./scripts/mint-to-wallet.sh CXtxLzHiFb6ChVfHkhPAe2teyuMCCxsr1tCxmmc5WiGa 3
```

This will mint 3 NFTs to that wallet.

## After Minting

1. Refresh the frontend page
2. Your NFTs should appear in the selection grid
3. Select an NFT and create a listing!

## Alternative: Manual Minting

If you prefer to mint manually:

```bash
# Create NFT token
spl-token create-token --decimals 0

# Note the mint address from output, then:
MINT_ADDRESS=<from_output>

# Create account for your wallet
spl-token create-account $MINT_ADDRESS --owner YOUR_WALLET_ADDRESS

# Mint 1 token
spl-token mint $MINT_ADDRESS 1 YOUR_WALLET_ADDRESS
```

Repeat for each NFT you want to create.
