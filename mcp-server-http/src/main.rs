// HTTP bridge for MCP server (stdio-based)
use axum::{
    extract::Json,
    http::StatusCode,
    response::Json as ResponseJson,
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use tokio::process::Command;
use tokio::io::AsyncWriteExt;
use std::process::Stdio;
use tower_http::cors::CorsLayer;

#[derive(Deserialize)]
struct McpRequest {
    listing_pda: Option<String>,
    escrow_pda: Option<String>,
    nft_mint: Option<String>,
    seller: Option<String>,
}

#[derive(Serialize)]
struct McpResponse {
    result: serde_json::Value,
}

async fn call_mcp(method: &str, params: serde_json::Value) -> Result<serde_json::Value, StatusCode> {
    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });

    let mcp_binary = std::env::var("MCP_BINARY")
        .unwrap_or_else(|_| "../mcp/target/release/marketplace-mcp".to_string());
    
    let mut child = Command::new(mcp_binary)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(request.to_string().as_bytes()).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        stdin.write_all(b"\n").await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        stdin.shutdown().await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    let output = child
        .wait_with_output()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(result) = response.get("result") {
        Ok(result.clone())
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

async fn get_listing_state(Json(req): Json<McpRequest>) -> Result<ResponseJson<McpResponse>, StatusCode> {
    let listing_pda = req.listing_pda.ok_or(StatusCode::BAD_REQUEST)?;
    let params = serde_json::json!({ "listing_pda": listing_pda });
    let result = call_mcp("resources/get_listing_state", params).await?;
    Ok(ResponseJson(McpResponse { result }))
}

async fn get_escrow_state(Json(req): Json<McpRequest>) -> Result<ResponseJson<McpResponse>, StatusCode> {
    let escrow_pda = req.escrow_pda.ok_or(StatusCode::BAD_REQUEST)?;
    let params = serde_json::json!({ "escrow_pda": escrow_pda });
    let result = call_mcp("resources/get_escrow_state", params).await?;
    Ok(ResponseJson(McpResponse { result }))
}

async fn get_listing_summary(Json(req): Json<McpRequest>) -> Result<ResponseJson<McpResponse>, StatusCode> {
    let nft_mint = req.nft_mint.ok_or(StatusCode::BAD_REQUEST)?;
    let seller = req.seller.ok_or(StatusCode::BAD_REQUEST)?;
    let params = serde_json::json!({ "nft_mint": nft_mint, "seller": seller });
    let result = call_mcp("resources/get_listing_summary", params).await?;
    Ok(ResponseJson(McpResponse { result }))
}

async fn simulate_purchase(Json(req): Json<McpRequest>) -> Result<ResponseJson<McpResponse>, StatusCode> {
    let listing_pda = req.listing_pda.ok_or(StatusCode::BAD_REQUEST)?;
    let params = serde_json::json!({ "listing_pda": listing_pda });
    let result = call_mcp("tools/simulate_purchase", params).await?;
    Ok(ResponseJson(McpResponse { result }))
}

async fn validate_listing(Json(req): Json<McpRequest>) -> Result<ResponseJson<McpResponse>, StatusCode> {
    let listing_pda = req.listing_pda.ok_or(StatusCode::BAD_REQUEST)?;
    let params = serde_json::json!({ "listing_pda": listing_pda });
    let result = call_mcp("tools/validate_listing", params).await?;
    Ok(ResponseJson(McpResponse { result }))
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/resources/get_listing_state", post(get_listing_state))
        .route("/resources/get_escrow_state", post(get_escrow_state))
        .route("/resources/get_listing_summary", post(get_listing_summary))
        .route("/tools/simulate_purchase", post(simulate_purchase))
        .route("/tools/validate_listing", post(validate_listing))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("MCP HTTP bridge listening on http://0.0.0.0:8080");
    axum::serve(listener, app).await.unwrap();
}
