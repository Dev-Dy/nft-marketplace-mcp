// Escrow resource - read-only account state
use anyhow::{Context, Result};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_sdk::pubkey::Pubkey;
use sha2::{Sha256, Digest};
use crate::rpc::MarketplaceRpc;

// Calculate Anchor discriminator: first 8 bytes of sha256("account:Escrow")
fn escrow_discriminator() -> [u8; 8] {
    let mut hasher = Sha256::new();
    hasher.update(b"account:Escrow");
    let hash = hasher.finalize();
    let mut discriminator = [0u8; 8];
    discriminator.copy_from_slice(&hash[..8]);
    discriminator
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct Escrow {
    pub listing: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub settled: bool,
    pub bump: u8,
}

#[derive(Debug, serde::Serialize)]
pub struct EscrowState {
    pub escrow_pda: String,
    pub listing: String,
    pub buyer: String,
    pub amount: u64,
    pub settled: bool,
    pub bump: u8,
}

impl Escrow {
    // Deserialize from account data (skip Anchor discriminator)
    pub fn from_account_data(data: &[u8]) -> Result<Self> {
        if data.len() < 8 {
            anyhow::bail!("Account data too short");
        }
        
        // Verify discriminator
        let expected_disc = escrow_discriminator();
        if &data[..8] != expected_disc {
            anyhow::bail!("Invalid account discriminator");
        }
        
        // Skip 8-byte Anchor discriminator
        let account_data = &data[8..];
        Self::try_from_slice(account_data)
            .context("Failed to deserialize Escrow")
    }

    // Calculate escrow PDA from listing
    pub fn derive_escrow_pda(
        program_id: &Pubkey,
        listing_pda: &Pubkey,
    ) -> Result<(Pubkey, u8)> {
        Pubkey::try_find_program_address(
            &[
                b"escrow",
                listing_pda.as_ref(),
            ],
            program_id,
        )
        .ok_or_else(|| anyhow::anyhow!("No valid PDA found"))
    }

    // Fetch escrow state from blockchain (read-only)
    pub async fn get_state(
        rpc: &MarketplaceRpc,
        escrow_pda: &Pubkey,
    ) -> Result<EscrowState> {
        let data = rpc.get_account_data(escrow_pda)
            .await?
            .context("Escrow account not found")?;

        // Verify account belongs to program
        if !rpc.verify_program_account(escrow_pda).await? {
            anyhow::bail!("Account does not belong to marketplace program");
        }

        let escrow = Self::from_account_data(&data)?;

        Ok(EscrowState {
            escrow_pda: escrow_pda.to_string(),
            listing: escrow.listing.to_string(),
            buyer: escrow.buyer.to_string(),
            amount: escrow.amount,
            settled: escrow.settled,
            bump: escrow.bump,
        })
    }
}
