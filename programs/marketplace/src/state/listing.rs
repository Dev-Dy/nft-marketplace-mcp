use anchor_lang::prelude::*;

#[account]
pub struct Listing {
    /// Seller who created the listing
    pub seller: Pubkey,

    /// NFT mint being sold
    pub nft_mint: Pubkey,

    /// Sale price in lamports
    pub price: u64,

    /// Royalty in basis points (1% = 100)
    pub royalty_bps: u16,

    /// Creator who receives royalties
    pub creator: Pubkey,

    /// Whether the listing is active
    pub active: bool,

    /// PDA bump
    pub bump: u8,
}

impl Listing {
    pub const LEN: usize =
        8 +   // discriminator
        32 +  // seller
        32 +  // nft_mint
        8 +   // price
        2 +   // royalty_bps
        32 +  // creator
        1 +   // active
        1;    // bump
}
