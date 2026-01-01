// Purchase simulation - pure computation, no transactions
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;
use crate::rpc::MarketplaceRpc;
use crate::resources::listing::Listing;

#[derive(Debug, Deserialize)]
pub struct SimulatePurchaseInput {
    pub listing_pda: String,
}

#[derive(Debug, Serialize)]
pub struct SimulatePurchaseOutput {
    pub listing_active: bool,
    pub total_price: u64,
    pub royalty_amount: u64,
    pub seller_payout: u64,
    pub royalty_bps: u16,
}

// Pure computation - calculates purchase breakdown without executing transaction
pub async fn simulate_purchase(
    rpc: &MarketplaceRpc,
    input: SimulatePurchaseInput,
) -> Result<SimulatePurchaseOutput> {
    // Validate input
    let listing_pda = Pubkey::from_str(&input.listing_pda)
        .context("Invalid listing PDA")?;

    // Fetch listing state (read-only)
    let listing_state = Listing::get_state(rpc, &listing_pda)
        .await
        .context("Failed to fetch listing")?;

    // Calculate breakdown (pure computation)
    let total_price = listing_state.price;
    let royalty_amount = (total_price as u128 * listing_state.royalty_bps as u128 / 10_000) as u64;
    let seller_payout = total_price.saturating_sub(royalty_amount);

    Ok(SimulatePurchaseOutput {
        listing_active: listing_state.active,
        total_price,
        royalty_amount,
        seller_payout,
        royalty_bps: listing_state.royalty_bps,
    })
}
