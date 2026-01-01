// MCP Server entry point - completely off-chain, read-only interface
mod server;
mod rpc;
mod resources;
mod tools;

use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    server::run().await
}
