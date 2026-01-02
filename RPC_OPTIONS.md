# RPC Endpoint Options

If you're hitting rate limits on the public Solana RPC, here are free alternatives:

## Free Devnet RPC Endpoints

### Option 1: Helius (Recommended - Free Tier)
```bash
# Get free API key from https://www.helius.dev/
# Free tier: 100k requests/month

# Frontend (.env file):
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Frontend (.env.local):
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

### Option 2: QuickNode (Free Tier)
```bash
# Sign up at https://www.quicknode.com/
# Free tier available for devnet

# Frontend (.env file):
VITE_SOLANA_RPC_URL=https://YOUR_ENDPOINT.quicknode.com/YOUR_API_KEY

# Frontend (.env.local):
VITE_SOLANA_RPC_URL=https://YOUR_ENDPOINT.quicknode.com/YOUR_API_KEY
```

### Option 3: Triton (Free Tier)
```bash
# Sign up at https://triton.one/
# Free tier: 1M requests/month

# Frontend (.env file):
VITE_SOLANA_RPC_URL=https://devnet.rpcpool.com/YOUR_API_KEY

# Frontend (.env.local):
VITE_SOLANA_RPC_URL=https://devnet.rpcpool.com/YOUR_API_KEY
```

### Option 4: Local Validator (No Rate Limits)
```bash
# Start local Solana validator
solana-test-validator

# Frontend (.env file):
VITE_SOLANA_RPC_URL=http://localhost:8899

# Frontend (.env.local):
VITE_SOLANA_RPC_URL=http://localhost:8899
```

## Configuration

### Frontend (.env file in `app/` directory)
```bash
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Rate Limit Solutions

1. **Use Free RPC Providers** (Helius, QuickNode, Triton)
   - Sign up for free tier
   - Get API key
   - Update RPC URLs

2. **Use Local Validator**
   - No rate limits
   - Fastest option
   - Requires deploying program locally

3. **Rotate Public Endpoints**
   - Try different public RPCs
   - Use multiple wallets/keys

4. **Add Request Delays**
   - Implement retry logic with exponential backoff
   - Cache responses when possible

## Quick Fix: Switch to Local Validator

If you just want to test without rate limits:

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Deploy program locally
anchor deploy

# Terminal 3: Start frontend with local RPC
cd app
echo "VITE_SOLANA_RPC_URL=http://localhost:8899" > .env
npm run dev
```

## Recommended Setup for Development

1. **Local Validator** for active development (no limits, fast)
2. **Helius/QuickNode** for testing with real devnet state
3. **Public RPC** as fallback (with rate limit handling)
