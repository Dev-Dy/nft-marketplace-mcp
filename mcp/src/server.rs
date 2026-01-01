// MCP Server implementation - JSON-RPC over stdio
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::{self, BufRead, BufReader, Write};
use std::str::FromStr;
use crate::rpc::MarketplaceRpc;
use crate::resources::{Listing, Escrow};
use crate::tools::{simulate_purchase, validate_listing};

#[derive(Debug, Deserialize)]
struct McpRequest {
    jsonrpc: String,
    id: Option<Value>,
    method: String,
    params: Option<Value>,
}

#[derive(Debug, Serialize)]
struct McpResponse {
    jsonrpc: String,
    id: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<McpError>,
}

#[derive(Debug, Serialize)]
struct McpError {
    code: i32,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<Value>,
}

pub struct McpServer {
    rpc: MarketplaceRpc,
}

impl McpServer {
    pub fn new(rpc_url: String) -> Result<Self> {
        let rpc = MarketplaceRpc::new(rpc_url)
            .context("Failed to initialize RPC client")?;
        Ok(Self { rpc })
    }

    pub async fn handle_request(&self, request: McpRequest) -> Result<McpResponse> {
        let result = match request.method.as_str() {
            // Resources
            "resources/get_listing_state" => {
                self.handle_get_listing_state(request.params).await
            }
            "resources/get_escrow_state" => {
                self.handle_get_escrow_state(request.params).await
            }
            "resources/get_listing_summary" => {
                self.handle_get_listing_summary(request.params).await
            }
            // Tools
            "tools/simulate_purchase" => {
                self.handle_simulate_purchase(request.params).await
            }
            "tools/validate_listing" => {
                self.handle_validate_listing(request.params).await
            }
            _ => Err(anyhow::anyhow!("Unknown method: {}", request.method)),
        };

        match result {
            Ok(value) => Ok(McpResponse {
                jsonrpc: "2.0".to_string(),
                id: request.id,
                result: Some(value),
                error: None,
            }),
            Err(e) => Ok(McpResponse {
                jsonrpc: "2.0".to_string(),
                id: request.id,
                result: None,
                error: Some(McpError {
                    code: -32603,
                    message: e.to_string(),
                    data: None,
                }),
            }),
        }
    }

    async fn handle_get_listing_state(&self, params: Option<Value>) -> Result<Value> {
        let params: serde_json::Map<String, Value> = params
            .and_then(|p| serde_json::from_value(p).ok())
            .context("Invalid params")?;
        
        let listing_pda_str = params
            .get("listing_pda")
            .and_then(|v| v.as_str())
            .context("Missing listing_pda")?;

        let listing_pda = solana_sdk::pubkey::Pubkey::from_str(listing_pda_str)
            .context("Invalid listing_pda")?;

        let state = Listing::get_state(&self.rpc, &listing_pda)
            .await?;
        
        Ok(serde_json::to_value(state)?)
    }

    async fn handle_get_escrow_state(&self, params: Option<Value>) -> Result<Value> {
        let params: serde_json::Map<String, Value> = params
            .and_then(|p| serde_json::from_value(p).ok())
            .context("Invalid params")?;
        
        let escrow_pda_str = params
            .get("escrow_pda")
            .and_then(|v| v.as_str())
            .context("Missing escrow_pda")?;

        let escrow_pda = solana_sdk::pubkey::Pubkey::from_str(escrow_pda_str)
            .context("Invalid escrow_pda")?;

        let state = Escrow::get_state(&self.rpc, &escrow_pda)
            .await?;
        
        Ok(serde_json::to_value(state)?)
    }

    async fn handle_get_listing_summary(&self, params: Option<Value>) -> Result<Value> {
        let params: serde_json::Map<String, Value> = params
            .and_then(|p| serde_json::from_value(p).ok())
            .context("Invalid params")?;
        
        let nft_mint_str = params
            .get("nft_mint")
            .and_then(|v| v.as_str())
            .context("Missing nft_mint")?;
        let seller_str = params
            .get("seller")
            .and_then(|v| v.as_str())
            .context("Missing seller")?;

        let nft_mint = solana_sdk::pubkey::Pubkey::from_str(nft_mint_str)
            .context("Invalid nft_mint")?;
        let seller = solana_sdk::pubkey::Pubkey::from_str(seller_str)
            .context("Invalid seller")?;

        let state = Listing::get_summary(&self.rpc, &nft_mint, &seller)
            .await?;
        
        Ok(serde_json::to_value(state)?)
    }

    async fn handle_simulate_purchase(&self, params: Option<Value>) -> Result<Value> {
        let input: simulate_purchase::SimulatePurchaseInput = serde_json::from_value(
            params.context("Missing params")?
        )?;

        let output = simulate_purchase(&self.rpc, input).await?;
        Ok(serde_json::to_value(output)?)
    }

    async fn handle_validate_listing(&self, params: Option<Value>) -> Result<Value> {
        let input: validate_listing::ValidateListingInput = serde_json::from_value(
            params.context("Missing params")?
        )?;

        let output = validate_listing(&self.rpc, input).await?;
        Ok(serde_json::to_value(output)?)
    }
}

pub async fn run() -> Result<()> {
    // Get RPC URL from environment or use default
    let rpc_url = std::env::var("SOLANA_RPC_URL")
        .unwrap_or_else(|_| "https://api.mainnet-beta.solana.com".to_string());

    let server = McpServer::new(rpc_url)?;

    // MCP protocol over stdio
    let stdin = io::stdin();
    let mut stdout = io::stdout();
    let reader = BufReader::new(stdin.lock());

    for line in reader.lines() {
        let line = line.context("Failed to read line")?;
        if line.is_empty() {
            continue;
        }

        let request: McpRequest = serde_json::from_str(&line)
            .context("Failed to parse request")?;

        let response = server.handle_request(request).await?;
        let response_json = serde_json::to_string(&response)?;
        
        writeln!(stdout, "{}", response_json)?;
        stdout.flush()?;
    }

    Ok(())
}
