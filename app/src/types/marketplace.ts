// Types matching on-chain program
export interface Listing {
  seller: string;
  nftMint: string;
  price: bigint;
  royaltyBps: number;
  creator: string;
  active: boolean;
  bump: number;
}

export interface Escrow {
  listing: string;
  buyer: string;
  amount: bigint;
  settled: boolean;
  bump: number;
}

// MCP response types
export interface ListingState {
  listing_pda: string;
  seller: string;
  nft_mint: string;
  price: number;
  royalty_bps: number;
  creator: string;
  active: boolean;
  bump: number;
}

export interface EscrowState {
  escrow_pda: string;
  listing: string;
  buyer: string;
  amount: number;
  settled: boolean;
  bump: number;
}

export interface SimulatePurchaseOutput {
  listing_active: boolean;
  total_price: number;
  royalty_amount: number;
  seller_payout: number;
  royalty_bps: number;
}
