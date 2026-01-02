# Deployment Guide

## Quick Deploy to Devnet

### Step 1: Get Devnet SOL

Your wallet address: **CXtxLzHiFb6ChVfHkhPAe2teyuMCCxsr1tCxmmc5WiGa**

**Option 1: Web Faucet (Recommended)**
1. Visit: https://faucet.solana.com/
2. Enter your address: `CXtxLzHiFb6ChVfHkhPAe2teyuMCCxsr1tCxmmc5WiGa`
3. Request 2 SOL
4. Wait for confirmation

**Option 2: CLI Airdrop**
```bash
solana airdrop 2
```

**Option 3: Alternative Faucet**
- https://solfaucet.com/
- https://faucet.quicknode.com/solana/devnet

### Step 2: Deploy

**Option A: Use the deployment script**
```bash
./scripts/deploy.sh
```

**Option B: Manual deployment**
```bash
# Ensure you're on devnet
solana config set --url https://api.devnet.solana.com

# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet
```

### Step 3: Verify Deployment

```bash
solana program show Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6
```

## Program Information

- **Program ID**: `Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6`
- **Network**: Devnet
- **Deployment Cost**: ~2.04 SOL

## After Deployment

1. **Update Frontend Configuration**
   - Set `VITE_SOLANA_RPC_URL` to devnet RPC
   - Update program ID if it changed

2. **Start Frontend**
   ```bash
   cd app
   npm run dev
   ```

## Troubleshooting

### "Insufficient funds"
- Get more SOL from faucet
- Check balance: `solana balance`

### "Program already deployed"
- If program ID matches, you can skip deployment
- Or upgrade: `anchor upgrade target/deploy/nft_marketplace.so --program-id Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6`

### "Rate limit reached"
- Wait a few minutes and try again
- Use web faucet instead of CLI
