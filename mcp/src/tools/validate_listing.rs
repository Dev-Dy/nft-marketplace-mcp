// Listing validation - checks PDA correctness and consistency
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;
use crate::rpc::MarketplaceRpc;
use crate::resources::listing::Listing;
use crate::resources::escrow::Escrow;

#[derive(Debug, Deserialize)]
pub struct ValidateListingInput {
    pub listing_pda: String,
}

#[derive(Debug, Serialize)]
pub struct ValidationIssue {
    pub field: String,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct ValidateListingOutput {
    pub is_valid: bool,
    pub pda_correct: bool,
    pub escrow_exists: bool,
    pub escrow_consistent: bool,
    pub listing_active: bool,
    pub issues: Vec<ValidationIssue>,
}

// Validation tool - checks PDA derivation and data consistency (read-only)
pub async fn validate_listing(
    rpc: &MarketplaceRpc,
    input: ValidateListingInput,
) -> Result<ValidateListingOutput> {
    let mut issues = Vec::new();
    let mut pda_correct = false;
    let mut escrow_exists = false;
    let mut escrow_consistent = false;
    let listing_active;

    // Validate input
    let listing_pda = Pubkey::from_str(&input.listing_pda)
        .context("Invalid listing PDA")?;

    // Fetch listing state
    let listing_state = match Listing::get_state(rpc, &listing_pda).await {
        Ok(state) => {
            listing_active = state.active;
            state
        }
        Err(e) => {
            issues.push(ValidationIssue {
                field: "listing".to_string(),
                message: format!("Failed to fetch listing: {}", e),
            });
            return Ok(ValidateListingOutput {
                is_valid: false,
                pda_correct: false,
                escrow_exists: false,
                escrow_consistent: false,
                listing_active: false,
                issues,
            });
        }
    };

    // Verify PDA derivation matches
    let nft_mint = Pubkey::from_str(&listing_state.nft_mint)
        .context("Invalid NFT mint in listing")?;
    let seller = Pubkey::from_str(&listing_state.seller)
        .context("Invalid seller in listing")?;

    match Listing::derive_listing_pda(rpc.program_id(), &nft_mint, &seller) {
        Ok((derived_pda, derived_bump)) => {
            if derived_pda == listing_pda {
                pda_correct = true;
            } else {
                issues.push(ValidationIssue {
                    field: "pda".to_string(),
                    message: format!(
                        "PDA mismatch: expected {}, got {}",
                        derived_pda, listing_pda
                    ),
                });
            }
            if derived_bump != listing_state.bump {
                issues.push(ValidationIssue {
                    field: "bump".to_string(),
                    message: format!(
                        "Bump mismatch: expected {}, got {}",
                        derived_bump, listing_state.bump
                    ),
                });
            }
        }
        Err(e) => {
            issues.push(ValidationIssue {
                field: "pda_derivation".to_string(),
                message: format!("Failed to derive PDA: {}", e),
            });
        }
    }

    // Check escrow if it exists
    match Escrow::derive_escrow_pda(rpc.program_id(), &listing_pda) {
        Ok((escrow_pda, _)) => {
            match Escrow::get_state(rpc, &escrow_pda).await {
                Ok(escrow_state) => {
                    escrow_exists = true;
                    
                    // Validate consistency
                    if escrow_state.listing != listing_pda.to_string() {
                        issues.push(ValidationIssue {
                            field: "escrow_listing".to_string(),
                            message: "Escrow listing reference mismatch".to_string(),
                        });
                    } else {
                        escrow_consistent = true;
                    }

                    if escrow_state.amount != listing_state.price {
                        issues.push(ValidationIssue {
                            field: "escrow_amount".to_string(),
                            message: format!(
                                "Escrow amount {} does not match listing price {}",
                                escrow_state.amount, listing_state.price
                            ),
                        });
                    }

                    if escrow_state.settled && listing_state.active {
                        issues.push(ValidationIssue {
                            field: "state_consistency".to_string(),
                            message: "Escrow is settled but listing is still active".to_string(),
                        });
                    }
                }
                Err(_) => {
                    // Escrow doesn't exist - this is valid for new listings
                }
            }
        }
        Err(e) => {
            issues.push(ValidationIssue {
                field: "escrow_pda_derivation".to_string(),
                message: format!("Failed to derive escrow PDA: {}", e),
            });
        }
    }

    let is_valid = issues.is_empty() && pda_correct;

    Ok(ValidateListingOutput {
        is_valid,
        pda_correct,
        escrow_exists,
        escrow_consistent,
        listing_active,
        issues,
    })
}
