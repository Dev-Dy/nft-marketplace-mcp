# Marketplace Frontend

React + Vite + TypeScript frontend for the Solana NFT Marketplace.

## Setup

1. Install dependencies:
```bash
cd app
npm install
```

2. Build the Anchor program to generate IDL:
```bash
cd ..
anchor build
cp target/idl/marketplace.json app/src/idl/marketplace.json
```

3. Start MCP HTTP bridge (in separate terminal):
```bash
cd mcp-server-http
cargo run
```

4. Start frontend dev server:
```bash
cd app
npm run dev
```

## Environment Variables

Create `.env` file:
```
VITE_MCP_API_URL=http://localhost:8080
```

## Features

- Wallet connection (Phantom, Solflare)
- View listings (from MCP)
- Fund escrow
- Settle trade
- Cancel listing (seller only)
- Purchase simulation (from MCP)
