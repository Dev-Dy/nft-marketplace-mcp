# Solana NFT Marketplace

A decentralized NFT marketplace built on Solana using Anchor framework, featuring escrow-based trading and royalty enforcement.

## Architecture

### On-Chain Program

The marketplace consists of two main account types:

1. **Listing PDA**: Stores listing information
   - Seller, NFT mint, price, royalty basis points
   - Creator address (for royalties)
   - Active status flag
   - PDA seeds: `["listing", nft_mint, seller]`

2. **Escrow PDA**: Holds buyer funds until trade settlement
   - Listing reference, buyer address
   - Escrowed amount (lamports)
   - Settled status flag
   - PDA seeds: `["escrow", listing_pda]`

### Instructions

- **`create_listing`**: Seller creates a listing for their NFT
  - Validates seller owns the NFT
  - Enforces price > 0 and royalty <= 10000 bps
  - Creates listing PDA

- **`fund_escrow`**: Buyer funds escrow for a listing
  - Transfers SOL from buyer to escrow PDA
  - Creates escrow account
  - Requires listing to be active

- **`settle_trade`**: Completes escrow-based trade
  - Transfers NFT from seller to buyer
  - Distributes payments (seller + creator royalty)
  - Deactivates listing and marks escrow as settled
  - Requires both buyer and seller signatures

- **`buy_nft`**: Direct purchase without escrow
  - Transfers SOL directly from buyer to seller/creator
  - Transfers NFT from seller to buyer
  - Single transaction, no escrow

- **`cancel_listing`**: Seller cancels listing
  - If escrow exists, refunds buyer
  - Deactivates listing
  - Seller-authoritative (only seller can cancel)

## Escrow Flow

### Standard Flow
1. Seller creates listing → `create_listing`
2. Buyer funds escrow → `fund_escrow`
3. Both parties settle → `settle_trade`
   - NFT transferred to buyer
   - Payments distributed (seller + royalty)

### Cancellation Flow
1. Seller creates listing → `create_listing`
2. Buyer funds escrow → `fund_escrow`
3. Seller cancels → `cancel_listing`
   - Buyer refunded from escrow
   - Listing deactivated

### Direct Purchase Flow
1. Seller creates listing → `create_listing`
2. Buyer purchases directly → `buy_nft`
   - No escrow created
   - Single transaction

## Security Model

### Authority Checks
- **Listing creation**: Only seller can create listing for their NFT
- **Escrow funding**: Any buyer can fund escrow (public)
- **Trade settlement**: Requires both buyer and seller signatures
- **Listing cancellation**: Only seller can cancel their listing
- **Direct purchase**: Requires both buyer and seller signatures

### Safety Guarantees
- **No stuck funds**: All escrow funds are either settled or refunded
- **No stuck NFTs**: NFT only transferred after payment or refund
- **Royalty enforcement**: On-chain royalty calculation and distribution
- **Double-spend prevention**: Escrow can only be settled once
- **PDA validation**: All PDAs validated via seeds and bumps

### Invariants
1. Escrow amount must equal listing price
2. Listing must be active for escrow funding and settlement
3. Escrow cannot be settled twice (`settled` flag check)
4. NFT accounts must match listing's mint
5. Seller must own NFT at listing creation
6. Buyer must match escrow buyer on cancellation

## Data Fetching

The frontend fetches data directly from on-chain accounts using Anchor's account fetching methods. All marketplace state is read directly from the blockchain via RPC calls.

### Features
- Direct account fetching via Anchor program interface
- No external services required
- Real-time blockchain data
- Type-safe account deserialization

## Development

### Prerequisites
- Rust (latest stable)
- Anchor framework
- Solana CLI
- Node.js and Yarn

### Build
```bash
anchor build
```

### Test
```bash
anchor test
```

### Deploy
```bash
anchor deploy
```

## Testing

The test suite covers:
- Listing creation with validation
- Escrow funding and safety
- Trade settlement with payment distribution
- Direct purchases
- Listing cancellation with refunds
- Edge cases (inactive listings, double-settle prevention, etc.)

Run tests:
```bash
anchor test
```

## Program ID

```
Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6
```

## License

[Specify your license]
