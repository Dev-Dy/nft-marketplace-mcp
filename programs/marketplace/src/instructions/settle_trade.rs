use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::{Listing, Escrow};
use crate::errors::MarketplaceError;

#[derive(Accounts)]
pub struct SettleTrade<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(mut)]
    pub creator: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            listing.key().as_ref()
        ],
        bump = escrow.bump,
        has_one = listing,
        has_one = buyer,
        constraint = !escrow.settled
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        constraint = listing.active,
        has_one = seller,
        has_one = creator
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        mut,
        constraint = seller_nft_account.mint == listing.nft_mint,
        constraint = seller_nft_account.owner == seller.key(),
        constraint = seller_nft_account.amount == 1
    )]
    pub seller_nft_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = buyer_nft_account.mint == listing.nft_mint,
        constraint = buyer_nft_account.owner == buyer.key()
    )]
    pub buyer_nft_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SettleTrade>) -> Result<()> {
    // Validate escrow amount matches listing price
    require!(
        ctx.accounts.escrow.amount == ctx.accounts.listing.price,
        MarketplaceError::InvalidPrice
    );

    let price = ctx.accounts.escrow.amount;
    
    // Calculate royalty with overflow protection
    let royalty = price
        .checked_mul(ctx.accounts.listing.royalty_bps as u64)
        .ok_or(MarketplaceError::InvalidRoyalty)?
        / 10_000;
    
    // Calculate seller amount with underflow protection
    let seller_amount = price
        .checked_sub(royalty)
        .ok_or(MarketplaceError::InvalidRoyalty)?;

    // Transfer NFT first
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.seller_nft_account.to_account_info(),
                to: ctx.accounts.buyer_nft_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        ),
        1,
    )?;

    // Verify escrow has sufficient balance
    let escrow_balance = ctx.accounts.escrow.to_account_info().lamports();
    require!(
        escrow_balance >= price,
        MarketplaceError::InvalidPrice
    );

    // Pay creator (manual lamport manipulation for accounts with data)
    if royalty > 0 {
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= royalty;
        **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += royalty;
    }

    // Pay seller
    **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= seller_amount;
    **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += seller_amount;

    // Update account state after transfers
    ctx.accounts.listing.active = false;
    ctx.accounts.escrow.settled = true;

    Ok(())
}
