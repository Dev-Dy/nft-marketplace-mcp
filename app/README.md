# NFT Marketplace Frontend

React + TypeScript frontend for the Solana NFT marketplace.

## Features

- 🎨 Modern, production-ready UI with animations
- 🔐 Solana wallet integration (Phantom, Solflare, etc.)
- 📱 Responsive design
- ⚡ Fast data fetching directly from blockchain
- 🎯 Type-safe with TypeScript

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

No environment variables required. The app connects directly to Solana RPC endpoints.

## Architecture

- **`src/lib/anchor.ts`**: Anchor client for transaction submission
- **`src/lib/data.ts`**: Direct account fetching from blockchain
- **`src/lib/nft.ts`**: NFT discovery utilities
- **`src/pages/`**: Main application pages
- **`src/components/`**: Reusable UI components

## Data Fetching

The frontend fetches data directly from on-chain accounts using Anchor's account fetching methods. No external services required.

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
