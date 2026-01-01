use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::Listing;
use crate::errors::MarketplaceError;

#[derive(Accounts)]
#[instruction(price: u64, royalty_bps: u16)]
pub struct CreateListing<'info> {
    /// Seller creating the listing
    #[account(mut)]
    pub seller: Signer<'info>,

    /// NFT mint being listed
    pub nft_mint: Account<'info, Mint>,

    /// Seller's token account holding the NFT
    #[account(
        constraint = seller_nft_account.mint == nft_mint.key(),
        constraint = seller_nft_account.owner == seller.key(),
        constraint = seller_nft_account.amount == 1
    )]
    pub seller_nft_account: Account<'info, TokenAccount>,

    /// Listing PDA
    #[account(
        init,
        payer = seller,
        space = Listing::LEN,
        seeds = [
            b"listing",
            nft_mint.key().as_ref(),
            seller.key().as_ref()
        ],
        bump
    )]
    pub listing: Account<'info, Listing>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateListing>,
    price: u64,
    royalty_bps: u16,
) -> Result<()> {
    // Safety checks
    require!(price > 0, MarketplaceError::InvalidPrice);
    require!(royalty_bps <= 10_000, MarketplaceError::InvalidRoyalty);

    let listing = &mut ctx.accounts.listing;

    listing.seller = ctx.accounts.seller.key();
    listing.nft_mint = ctx.accounts.nft_mint.key();
    listing.price = price;
    listing.royalty_bps = royalty_bps;

    // For now, creator = seller
    // Later, we’ll derive this from metadata
    listing.creator = ctx.accounts.seller.key();

    listing.active = true;
    
    // Calculate and store the bump
    let (_listing_pda, bump) = Pubkey::find_program_address(
        &[
            b"listing",
            ctx.accounts.nft_mint.key().as_ref(),
            ctx.accounts.seller.key().as_ref(),
        ],
        ctx.program_id,
    );
    listing.bump = bump;

    Ok(())
}
