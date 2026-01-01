use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;

use crate::state::Listing;
use crate::errors::MarketplaceError;

#[derive(Accounts)]
pub struct BuyNft<'info> {
    /// Buyer paying for the NFT
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Seller receiving payment
    #[account(mut)]
    pub seller: Signer<'info>,

    /// Creator receiving royalty
    #[account(mut)]
    pub creator: SystemAccount<'info>,

    /// NFT mint
    pub nft_mint: Account<'info, anchor_spl::token::Mint>,

    /// Seller's NFT token account
    #[account(
        mut,
        constraint = seller_nft_account.mint == nft_mint.key(),
        constraint = seller_nft_account.owner == seller.key(),
        constraint = seller_nft_account.amount == 1
    )]
    pub seller_nft_account: Account<'info, TokenAccount>,

    /// Buyer's NFT token account
    #[account(
        mut,
        constraint = buyer_nft_account.mint == nft_mint.key(),
        constraint = buyer_nft_account.owner == buyer.key()
    )]
    pub buyer_nft_account: Account<'info, TokenAccount>,

    /// Listing PDA
    #[account(
        mut,
        seeds = [
            b"listing",
            nft_mint.key().as_ref(),
            seller.key().as_ref()
        ],
        bump = listing.bump,
        has_one = seller,
        has_one = nft_mint,
        has_one = creator
    )]
    pub listing: Account<'info, Listing>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<BuyNft>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;

    require!(listing.active, MarketplaceError::ListingInactive);

    let price = listing.price;
    let royalty_amount = price
        .checked_mul(listing.royalty_bps as u64)
        .unwrap()
        / 10_000;

    let seller_amount = price
        .checked_sub(royalty_amount)
        .ok_or(MarketplaceError::InvalidRoyalty)?;

    // Transfer royalty to creator
    if royalty_amount > 0 {
        invoke(
            &system_instruction::transfer(
                ctx.accounts.buyer.key,
                ctx.accounts.creator.key,
                royalty_amount,
            ),
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }

    // Transfer remaining SOL to seller
    invoke(
        &system_instruction::transfer(
            ctx.accounts.buyer.key,
            ctx.accounts.seller.key,
            seller_amount,
        ),
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Transfer NFT from seller to buyer
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.seller_nft_account.to_account_info(),
            to: ctx.accounts.buyer_nft_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        },
    );

    token::transfer(cpi_ctx, 1)?;

    // Close listing
    listing.active = false;

    Ok(())
}
