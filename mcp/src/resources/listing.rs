// Listing resource - read-only account state
use anyhow::{Context, Result};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::pubkey::Pubkey;
use sha2::{Sha256, Digest};
use crate::rpc::MarketplaceRpc;

// Calculate Anchor discriminator: first 8 bytes of sha256("account:Listing")
fn listing_discriminator() -> [u8; 8] {
    let mut hasher = Sha256::new();
    hasher.update(b"account:Listing");
    let hash = hasher.finalize();
    let mut discriminator = [0u8; 8];
    discriminator.copy_from_slice(&hash[..8]);
    discriminator
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct Listing {
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub royalty_bps: u16,
    pub creator: Pubkey,
    pub active: bool,
    pub bump: u8,
}

#[derive(Debug, serde::Serialize)]
pub struct ListingState {
    pub listing_pda: String,
    pub seller: String,
    pub nft_mint: String,
    pub price: u64,
    pub royalty_bps: u16,
    pub creator: String,
    pub active: bool,
    pub bump: u8,
}

impl Listing {
    // Deserialize from account data (skip Anchor discriminator)
    pub fn from_account_data(data: &[u8]) -> Result<Self> {
        if data.len() < 8 {
            anyhow::bail!("Account data too short");
        }
        
        // Verify discriminator
        let expected_disc = listing_discriminator();
        if &data[..8] != expected_disc {
            anyhow::bail!("Invalid account discriminator");
        }
        
        // Skip 8-byte Anchor discriminator
        let account_data = &data[8..];
        Self::try_from_slice(account_data)
            .context("Failed to deserialize Listing")
    }

    // Calculate listing PDA from seeds
    pub fn derive_listing_pda(
        program_id: &Pubkey,
        nft_mint: &Pubkey,
        seller: &Pubkey,
    ) -> Result<(Pubkey, u8)> {
        Pubkey::try_find_program_address(
            &[
                b"listing",
                nft_mint.as_ref(),
                seller.as_ref(),
            ],
            program_id,
        )
        .ok_or_else(|| anyhow::anyhow!("No valid PDA found"))
    }

    // Fetch listing state from blockchain (read-only)
    pub async fn get_state(
        rpc: &MarketplaceRpc,
        listing_pda: &Pubkey,
    ) -> Result<ListingState> {
        let data = rpc.get_account_data(listing_pda)
            .await?
            .context("Listing account not found")?;

        // Verify account belongs to program
        if !rpc.verify_program_account(listing_pda).await? {
            anyhow::bail!("Account does not belong to marketplace program");
        }

        let listing = Self::from_account_data(&data)?;

        Ok(ListingState {
            listing_pda: listing_pda.to_string(),
            seller: listing.seller.to_string(),
            nft_mint: listing.nft_mint.to_string(),
            price: listing.price,
            royalty_bps: listing.royalty_bps,
            creator: listing.creator.to_string(),
            active: listing.active,
            bump: listing.bump,
        })
    }

    // Get listing summary by deriving PDA (read-only)
    pub async fn get_summary(
        rpc: &MarketplaceRpc,
        nft_mint: &Pubkey,
        seller: &Pubkey,
    ) -> Result<ListingState> {
        let (listing_pda, _) = Self::derive_listing_pda(
            rpc.program_id(),
            nft_mint,
            seller,
        )?;

        Self::get_state(rpc, &listing_pda).await
    }
}
