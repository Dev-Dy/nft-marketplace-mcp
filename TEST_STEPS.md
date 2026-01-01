# Anchor Test Steps

## Prerequisites

1. **Install Anchor** (if not already installed):
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

2. **Install Solana CLI** (if not already installed):
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

3. **Install Node.js and Yarn**:
   ```bash
   # Node.js (v16+)
   # Yarn
   npm install -g yarn
   ```

## Steps to Run Anchor Tests

### 1. Navigate to Project Directory
```bash
cd /home/dheeru/workspace/nft-marketplace-mcp
```

### 2. Install Dependencies
```bash
# Install Rust dependencies (handled by Anchor)
# Install Node.js dependencies
yarn install
```

### 3. Build the Program
```bash
anchor build
```
This will:
- Compile the Rust program
- Generate the IDL (Interface Definition Language)
- Create the program binary in `target/deploy/`

### 4. Run Tests
```bash
anchor test
```

This command will:
- Start a local Solana validator (if not already running)
- Deploy your program to the local validator
- Run all tests in the `tests/` directory
- Clean up after tests complete

### 5. Run Tests with Specific Options

**Run tests with verbose output:**
```bash
anchor test --skip-local-validator
```

**Run tests and skip deployment (if program already deployed):**
```bash
anchor test --skip-deploy
```

**Run tests with logs:**
```bash
ANCHOR_LOG=error anchor test
```

## What Happens During `anchor test`

1. **Compilation**: Rust program is compiled
2. **IDL Generation**: TypeScript types are generated
3. **Local Validator**: Solana local validator starts (if needed)
4. **Program Deployment**: Program is deployed to local validator
5. **Test Execution**: TypeScript tests run using Mocha
6. **Cleanup**: Validator may shut down (depending on configuration)

## Troubleshooting

### If tests fail with "connection refused":
- The local validator might not be running
- Try: `solana-test-validator` in a separate terminal
- Or: `anchor test` should start it automatically

### If tests fail with "insufficient lamports":
- Increase airdrop amounts in test setup
- Check that accounts have enough SOL for transactions

### If tests fail with "account already in use":
- Each test should use unique accounts/mints
- Ensure proper cleanup between tests

### If program ID mismatch:
- Run `anchor keys list` to get program ID
- Update `declare_id!()` in `lib.rs`
- Update `Anchor.toml` with correct program ID
- Rebuild: `anchor build`

## Test File Structure

```
tests/
  └── marketplace.ts    # Your test file
```

## Common Test Commands

```bash
# Build only
anchor build

# Test only (assumes program already built)
anchor test --skip-build

# Clean build artifacts
anchor clean

# View program logs
anchor logs
```
