#!/bin/bash
# Simple test script for MCP server
# Requires a running Solana validator (localnet or devnet)

set -e

RPC_URL="${SOLANA_RPC_URL:-http://localhost:8899}"

echo "Testing MCP server with RPC: $RPC_URL"
echo ""

# Test 1: Get listing state (will fail if listing doesn't exist, but tests the interface)
echo "Test 1: Testing get_listing_state..."
echo '{"jsonrpc":"2.0","id":1,"method":"resources/get_listing_state","params":{"listing_pda":"11111111111111111111111111111111"}}' | \
    SOLANA_RPC_URL="$RPC_URL" cargo run --bin marketplace-mcp 2>&1 | head -5

echo ""
echo "Test 2: Testing validate_listing..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/validate_listing","params":{"listing_pda":"11111111111111111111111111111111"}}' | \
    SOLANA_RPC_URL="$RPC_URL" cargo run --bin marketplace-mcp 2>&1 | head -5

echo ""
echo "Note: These tests use dummy addresses. For real testing:"
echo "1. Deploy marketplace program to localnet/devnet"
echo "2. Create a test listing"
echo "3. Use the actual listing PDA in the test"
