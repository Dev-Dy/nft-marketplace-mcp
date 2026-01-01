# Troubleshooting: NFTs Not Showing

## Common Issue: Wallet Mismatch

The NFTs were minted to your **CLI wallet**:
```
CXtxLzHiFb6ChVfHkhPAe2teyuMCCxsr1tCxmmc5WiGa
```

But you might be connecting a **different wallet** in the browser (Phantom/Solflare).

## Solution 1: Import CLI Wallet to Phantom/Solflare

### For Phantom:
1. Open Phantom wallet
2. Go to Settings → Security & Privacy
3. Click "Export Private Key"
4. Copy the private key
5. In Phantom, click the wallet icon (top right)
6. Click "Add/Connect Wallet" → "Import Private Key"
7. Paste your CLI wallet's private key

**To get your CLI wallet private key:**
```bash
# Your keypair is at:
cat ~/.config/solana/id.json
# This is a JSON array - you'll need to convert it to base58 for Phantom
```

### For Solflare:
1. Open Solflare
2. Click "Import Wallet"
3. Select "Private Key"
4. Enter your private key

## Solution 2: Use CLI Wallet Directly

You can use the Solana CLI wallet directly in the browser by exporting it:

```bash
# Export wallet for Phantom
solana-keygen recover 'prompt://?full-path=/home/dheeru/.config/solana/id.json' -o phantom-key.json
```

## Solution 3: Mint NFTs to Your Browser Wallet

If you prefer to use your browser wallet:

1. **Get your browser wallet address:**
   - Connect wallet in the frontend
   - Check the address shown in the UI

2. **Mint NFTs to that address:**
   ```bash
   # Get the address from browser, then:
   WALLET_ADDRESS=<your_browser_wallet_address>
   
   # Create and mint NFT
   spl-token create-token --decimals 0
   MINT_ADDRESS=<from_output>
   spl-token create-account $MINT_ADDRESS --owner $WALLET_ADDRESS
   spl-token mint $MINT_ADDRESS 1 $WALLET_ADDRESS
   ```

## Verify NFTs Are in Wallet

### Check CLI Wallet:
```bash
spl-token accounts
```

### Check via RPC:
```bash
# Replace with your wallet address
solana account CXtxLzHiFb6ChVfHkhPAe2teyuMCCxsr1tCxmmc5WiGa
```

## Debug in Browser

1. Open browser console (F12)
2. Look for console logs:
   - "Fetching NFTs for wallet: ..."
   - "Found X token accounts"
   - "Found X NFTs"

3. Check for errors:
   - RPC connection errors
   - Wallet connection errors
   - Network errors

## Common Issues

### "No NFTs found" but you have NFTs
- **Wallet mismatch**: Browser wallet ≠ CLI wallet
- **Wrong network**: Make sure wallet is on **Devnet**
- **RPC issues**: Check if RPC endpoint is correct

### NFTs show in CLI but not in browser
- **Different wallets**: CLI wallet has NFTs, browser wallet doesn't
- **Solution**: Import CLI wallet or mint to browser wallet

### "Failed to load NFTs" error
- Check browser console for detailed error
- Verify RPC endpoint is accessible
- Check wallet is connected and on devnet

## Quick Fix Script

```bash
# Mint 3 NFTs to a specific wallet address
WALLET_ADDRESS=<your_wallet_address>
for i in {1..3}; do
  MINT=$(spl-token create-token --decimals 0 | grep -oP 'Creating token \K[1-9A-HJ-NP-Za-km-z]{32,44}')
  spl-token create-account $MINT --owner $WALLET_ADDRESS
  spl-token mint $MINT 1 $WALLET_ADDRESS
done
```
