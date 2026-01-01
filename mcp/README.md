# Marketplace MCP Server

A read-only MCP (Model Context Protocol) server for the Solana NFT marketplace.

## Safety Guarantees

- **Completely off-chain**: No blockchain state modifications
- **No transaction signing**: Never holds or uses private keys
- **Read-only access**: Only fetches account data via RPC
- **Pure computation**: Tools perform calculations without side effects

## Resources

- `get_listing_state(listing_pda)`: Fetch listing account state
- `get_escrow_state(escrow_pda)`: Fetch escrow account state
- `get_listing_summary(nft_mint, seller)`: Derive and fetch listing by seeds

## Tools

- `simulate_purchase(listing_pda)`: Calculate purchase breakdown (price, royalty, seller payout)
- `validate_listing(listing_pda)`: Validate PDA derivation and data consistency

## Usage

Set `SOLANA_RPC_URL` environment variable (defaults to mainnet):
```bash
export SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
cargo run
```

The server communicates via JSON-RPC over stdio.
