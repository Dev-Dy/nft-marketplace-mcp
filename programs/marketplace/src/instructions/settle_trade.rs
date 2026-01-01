use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::{Listing, Escrow};

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

    #[account(mut)]
    pub seller_nft_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_nft_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SettleTrade>) -> Result<()> {
    let price = ctx.accounts.escrow.amount;
    let royalty = price * ctx.accounts.listing.royalty_bps as u64 / 10_000;
    let seller_amount = price - royalty;

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
