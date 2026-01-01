use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::state::{Listing, Escrow};

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        seeds = [
            b"listing",
            listing.nft_mint.as_ref(),
            listing.seller.as_ref()
        ],
        bump = listing.bump,
        constraint = listing.active
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        init,
        payer = buyer,
        space = Escrow::LEN,
        seeds = [
            b"escrow",
            listing.key().as_ref()
        ],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<FundEscrow>) -> Result<()> {
    let price = ctx.accounts.listing.price;

    // Transfer SOL into escrow PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        ),
        price,
    )?;

    ctx.accounts.escrow.listing = ctx.accounts.listing.key();
    ctx.accounts.escrow.buyer = ctx.accounts.buyer.key();
    ctx.accounts.escrow.amount = price;
    ctx.accounts.escrow.settled = false;
    
    // Calculate and store the bump
    let (_escrow_pda, bump) = Pubkey::find_program_address(
        &[
            b"escrow",
            ctx.accounts.listing.key().as_ref(),
        ],
        ctx.program_id,
    );
    ctx.accounts.escrow.bump = bump;

    Ok(())
}
