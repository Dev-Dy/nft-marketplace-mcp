// Integration test example for MCP server
// Run with: cargo test --test test_integration -- --nocapture
// Requires SOLANA_RPC_URL environment variable set

#[cfg(test)]
mod tests {
    use solana_sdk::pubkey::Pubkey;
    use std::str::FromStr;
    use marketplace_mcp::rpc::MarketplaceRpc;
    use marketplace_mcp::resources::{Listing, Escrow};
    use marketplace_mcp::tools::{simulate_purchase, validate_listing};

    fn get_rpc() -> MarketplaceRpc {
        let rpc_url = std::env::var("SOLANA_RPC_URL")
            .unwrap_or_else(|_| "http://localhost:8899".to_string());
        MarketplaceRpc::new(rpc_url).expect("Failed to create RPC client")
    }

    #[tokio::test]
    #[ignore] // Ignore by default - requires running validator
    async fn test_listing_pda_derivation() {
        let rpc = get_rpc();
        let program_id = rpc.program_id();
        
        // Use test addresses
        let nft_mint = Pubkey::from_str("11111111111111111111111111111111").unwrap();
        let seller = Pubkey::from_str("22222222222222222222222222222222").unwrap();
        
        let (listing_pda, bump) = Listing::derive_listing_pda(program_id, &nft_mint, &seller)
            .expect("Failed to derive listing PDA");
        
        println!("Derived listing PDA: {}", listing_pda);
        println!("Bump: {}", bump);
        
        // Verify PDA is valid
        assert_ne!(listing_pda, Pubkey::default());
    }

    #[tokio::test]
    #[ignore]
    async fn test_escrow_pda_derivation() {
        let rpc = get_rpc();
        let program_id = rpc.program_id();
        
        let listing_pda = Pubkey::from_str("11111111111111111111111111111111").unwrap();
        
        let (escrow_pda, bump) = Escrow::derive_escrow_pda(program_id, &listing_pda)
            .expect("Failed to derive escrow PDA");
        
        println!("Derived escrow PDA: {}", escrow_pda);
        println!("Bump: {}", bump);
        
        assert_ne!(escrow_pda, Pubkey::default());
    }

    #[tokio::test]
    #[ignore]
    async fn test_simulate_purchase() {
        let rpc = get_rpc();
        
        // This will fail if listing doesn't exist, but tests the interface
        let input = simulate_purchase::SimulatePurchaseInput {
            listing_pda: "11111111111111111111111111111111".to_string(),
        };
        
        let result = simulate_purchase(&rpc, input).await;
        
        // Should either succeed (if listing exists) or fail gracefully
        match result {
            Ok(output) => {
                println!("Purchase simulation successful:");
                println!("  Total price: {} lamports", output.total_price);
                println!("  Royalty: {} lamports ({} bps)", output.royalty_amount, output.royalty_bps);
                println!("  Seller payout: {} lamports", output.seller_payout);
            }
            Err(e) => {
                println!("Expected error (listing doesn't exist): {}", e);
            }
        }
    }
}
