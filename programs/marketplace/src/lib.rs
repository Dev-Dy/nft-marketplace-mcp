use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod state;
pub mod instructions;

pub use instructions::*;

declare_id!("Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6");

#[program]
pub mod marketplace {
    use super::*;

    pub fn create_listing(
        ctx: Context<CreateListing>,
        price: u64,
        royalty_bps: u16,
    ) -> Result<()> {
        instructions::create_listing::handler(ctx, price, royalty_bps)
    }

    pub fn buy_nft(ctx: Context<BuyNft>) -> Result<()> {
        instructions::buy_nft::handler(ctx)
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::cancel_listing::handler(ctx)
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        instructions::fund_escrow::handler(ctx)
    }

    pub fn settle_trade(ctx: Context<SettleTrade>) -> Result<()> {
        instructions::settle_trade::handler(ctx)
    }
}
