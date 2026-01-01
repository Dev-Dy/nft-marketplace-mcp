use anchor_lang::prelude::*;

use crate::state::{Listing, Escrow};
use crate::errors::MarketplaceError;

#[derive(Accounts)]
pub struct CancelListing<'info> {
    /// Seller canceling the listing
    #[account(mut)]
    pub seller: Signer<'info>,

    /// Listing PDA
    #[account(
        mut,
        seeds = [
            b"listing",
            listing.nft_mint.as_ref(),
            seller.key().as_ref()
        ],
        bump = listing.bump,
        has_one = seller,
        constraint = listing.active
    )]
    pub listing: Account<'info, Listing>,

    /// Escrow PDA (optional)
    #[account(
        mut,
        seeds = [
            b"escrow",
            listing.key().as_ref()
        ],
        bump = escrow.bump,
        constraint = !escrow.settled
    )]
    pub escrow: Option<Account<'info, Escrow>>,

    /// Buyer to refund (only if escrow exists)
    #[account(mut)]
    pub buyer: Option<SystemAccount<'info>>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CancelListing>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;

    // If escrow exists, refund buyer
    if let Some(escrow) = ctx.accounts.escrow.as_mut() {
        let buyer = ctx
            .accounts
            .buyer
            .as_ref()
            .ok_or(MarketplaceError::MissingBuyer)?;

        let refund_amount = escrow.amount;

        // Refund buyer
        **escrow.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **buyer.to_account_info().try_borrow_mut_lamports()? += refund_amount;

        escrow.settled = true;
    }

    // Deactivate listing
    listing.active = false;

    Ok(())
}
