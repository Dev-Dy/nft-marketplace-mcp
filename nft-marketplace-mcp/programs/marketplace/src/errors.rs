use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError {
    #[msg("Price must be greater than zero")]
    InvalidPrice,

    #[msg("Royalty basis points must be <= 10000")]
    InvalidRoyalty,

    #[msg("Listing is not active")]
    ListingInactive,

    #[msg("Buyer is required when escrow exists")]
    MissingBuyer,
}
