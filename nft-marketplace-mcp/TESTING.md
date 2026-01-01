# Testing Guide

## Running Tests

### Standard Test Run
```bash
anchor test
```

This will:
1. Build the program
2. Start a local Solana validator
3. Deploy the program
4. Run all tests

### If Port Conflicts Occur

If you see "port 8899 is already in use", use one of these options:

**Option 1: Clean and test (recommended)**
```bash
yarn test:clean
```

This kills any existing validators and runs tests.

**Option 2: Use existing validator**
```bash
yarn test:skip-validator
```

This assumes a validator is already running on port 8899.

**Option 3: Manual cleanup**
```bash
# Kill existing validators
pkill -f solana-test-validator
# Or kill by port
lsof -ti:8899 | xargs kill -9
lsof -ti:8900 | xargs kill -9

# Then run tests
anchor test
```

## Troubleshooting

### Connection Refused Errors
- Ensure no other validators are running
- Wait a few seconds after killing validators before running tests
- Check that ports 8899 (RPC) and 8900 (WebSocket) are free

### Transaction Timeouts
- Increase timeout in test configuration if validator is slow to start
- The test file includes a validator readiness check in the `before` hook

### Program Not Deployed
- Run `anchor build` first to ensure program is compiled
- Check that program ID in `Anchor.toml` matches `lib.rs`
