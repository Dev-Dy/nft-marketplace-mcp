// RPC client wrapper - safe, read-only blockchain access
use anyhow::{Context, Result};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_client::rpc_config::RpcAccountInfoConfig;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::commitment_config::CommitmentConfig;
use std::str::FromStr;

// Program ID from marketplace program
const PROGRAM_ID: &str = "Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6";

pub struct MarketplaceRpc {
    client: RpcClient,
    program_id: Pubkey,
}

impl MarketplaceRpc {
    pub fn new(rpc_url: String) -> Result<Self> {
        let client = RpcClient::new_with_commitment(
            rpc_url,
            CommitmentConfig::confirmed(),
        );
        let program_id = Pubkey::from_str(PROGRAM_ID)
            .context("Invalid program ID")?;
        
        Ok(Self { client, program_id })
    }

    pub fn program_id(&self) -> &Pubkey {
        &self.program_id
    }

    // Fetch account data - returns raw bytes (safe, no deserialization)
    pub async fn get_account_data(&self, pubkey: &Pubkey) -> Result<Option<Vec<u8>>> {
        let response = self.client
            .get_account_with_config(
                pubkey,
                RpcAccountInfoConfig {
                    encoding: None, // Use binary encoding to get raw bytes
                    commitment: Some(self.client.commitment()),
                    data_slice: None,
                    min_context_slot: None,
                },
            )
            .await
            .context("RPC call failed")?;

        match response.value {
            Some(acc) => {
                // Account data is already decoded as Vec<u8> in Account struct
                Ok(Some(acc.data))
            }
            None => Ok(None),
        }
    }

    // Get account balance (lamports)
    pub async fn get_balance(&self, pubkey: &Pubkey) -> Result<u64> {
        let balance = self.client
            .get_balance(pubkey)
            .await
            .context("Failed to get balance")?;
        Ok(balance)
    }

    // Verify account exists and belongs to program
    pub async fn verify_program_account(&self, pubkey: &Pubkey) -> Result<bool> {
        let response = self.client
            .get_account_with_config(
                pubkey,
                RpcAccountInfoConfig {
                    encoding: None, // Use binary encoding
                    commitment: Some(self.client.commitment()),
                    data_slice: None,
                    min_context_slot: None,
                },
            )
            .await
            .context("RPC call failed")?;
        
        Ok(response.value
            .as_ref()
            .map(|acc| acc.owner == self.program_id)
            .unwrap_or(false))
    }
}
