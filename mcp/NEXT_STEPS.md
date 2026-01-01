# Next Steps for MCP Server

## 1. Test the Server

### Option A: Manual Testing with Local Validator

1. **Start a local Solana validator:**
   ```bash
   solana-test-validator
   ```

2. **Deploy the marketplace program:**
   ```bash
   cd ..
   anchor build
   anchor deploy
   ```

3. **Create a test listing** (using your existing Anchor tests as reference)

4. **Test the MCP server:**
   ```bash
   cd mcp
   export SOLANA_RPC_URL=http://localhost:8899
   ./test_mcp.sh
   ```

### Option B: Integration Tests

Run the integration tests (requires running validator):
```bash
cd mcp
export SOLANA_RPC_URL=http://localhost:8899
cargo test --test test_integration -- --nocapture
```

## 2. Connect to MCP Client

The server communicates via JSON-RPC over stdio. To use it with an MCP client:

```bash
# Example: Connect to MCP client
SOLANA_RPC_URL=http://localhost:8899 cargo run --bin marketplace-mcp
```

The client should send JSON-RPC requests like:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/get_listing_state",
  "params": {
    "listing_pda": "YOUR_LISTING_PDA_HERE"
  }
}
```

## 3. Enhancements (Optional)

- [ ] Add more validation checks
- [ ] Add caching layer for frequently accessed accounts
- [ ] Add rate limiting for RPC calls
- [ ] Add metrics/logging
- [ ] Create MCP client configuration file
- [ ] Add support for batch requests
- [ ] Add health check endpoint

## 4. Production Deployment

For production use:
1. Set `SOLANA_RPC_URL` to your preferred RPC endpoint (mainnet/devnet)
2. Consider using a dedicated RPC provider (Helius, QuickNode, etc.)
3. Add error monitoring (Sentry, etc.)
4. Set up process management (systemd, supervisor, etc.)

## 5. Documentation

- [ ] Add API documentation
- [ ] Create usage examples
- [ ] Document error codes
- [ ] Add troubleshooting guide
