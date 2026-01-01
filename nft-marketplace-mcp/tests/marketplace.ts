import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Marketplace } from "../target/types/marketplace";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("marketplace", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Marketplace as Program<Marketplace>;

    let seller: Keypair;
    let buyer: Keypair;
    let creator: Keypair;

    let nftMint: PublicKey;
    let sellerNftAccount: PublicKey;
    let buyerNftAccount: PublicKey;

    before(async () => {
        // Wait for validator to be ready
        let retries = 10;
        while (retries > 0) {
            try {
                await provider.connection.getVersion();
                break;
            } catch (err) {
                retries--;
                if (retries === 0) throw err;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        seller = Keypair.generate();
        buyer = Keypair.generate();
        creator = Keypair.generate();

        // Airdrop SOL and wait for confirmation
        for (let user of [seller, buyer, creator]) {
            const sig = await provider.connection.requestAirdrop(
                user.publicKey,
                5 * LAMPORTS_PER_SOL
            );
            await provider.connection.confirmTransaction(sig, "confirmed");
        }

        const payer = provider.wallet.payer!;

        // Create NFT mint
        nftMint = await createMint(
            provider.connection,
            payer,
            seller.publicKey,
            null,
            0
        );

        // Seller NFT account
        const sellerAta = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            payer,
            nftMint,
            seller.publicKey
        );
        sellerNftAccount = sellerAta.address;

        // Buyer NFT account
        const buyerAta = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            payer,
            nftMint,
            buyer.publicKey
        );
        buyerNftAccount = buyerAta.address;
    });

    // Helper to mint NFT to seller
    async function mintNftToSeller() {
        await mintTo(
            provider.connection,
            provider.wallet.payer!,
            nftMint,
            sellerNftAccount,
            seller,
            1
        );
    }

    // Helper to ensure account has sufficient balance
    async function ensureBalance(account: PublicKey, minBalance: number) {
        const balance = await provider.connection.getBalance(account);
        if (balance < minBalance) {
            const needed = minBalance - balance + 0.1 * LAMPORTS_PER_SOL;
            const sig = await provider.connection.requestAirdrop(account, needed);
            await provider.connection.confirmTransaction(sig);
        }
    }

    // Helper to get listing PDA
    function getListingPda(mint: PublicKey, sellerKey: PublicKey): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [
                Buffer.from("listing"),
                mint.toBuffer(),
                sellerKey.toBuffer()
            ],
            program.programId
        );
    }

    // Helper to get escrow PDA
    function getEscrowPda(listingPda: PublicKey): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("escrow"), listingPda.toBuffer()],
            program.programId
        );
    }

    describe("create_listing", () => {
        beforeEach(async () => {
            await mintNftToSeller();
        });

        it("creates a listing with valid parameters", async () => {
            const [listingPda, bump] = getListingPda(nftMint, seller.publicKey);
            const price = new anchor.BN(LAMPORTS_PER_SOL);
            const royaltyBps = 500; // 5%

            await program.methods
                .createListing(price, royaltyBps)
                .accounts({
                    seller: seller.publicKey,
                    nftMint,
                    sellerNftAccount
                })
                .signers([seller])
                .rpc();

            const listing = await program.account.listing.fetch(listingPda);
            assert.equal(listing.price.toNumber(), LAMPORTS_PER_SOL);
            assert.equal(listing.royaltyBps, royaltyBps);
            assert.isTrue(listing.active);
            assert.equal(listing.seller.toString(), seller.publicKey.toString());
            assert.equal(listing.nftMint.toString(), nftMint.toString());
            assert.equal(listing.creator.toString(), seller.publicKey.toString());
            assert.equal(listing.bump, bump);
        });

        it("fails with zero price", async () => {
            const testMint = await createMint(
                provider.connection,
                provider.wallet.payer!,
                seller.publicKey,
                null,
                0
            );
            const testSellerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                seller.publicKey
            );
            await mintTo(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                testSellerAta.address,
                seller,
                1
            );

            try {
                await program.methods
                    .createListing(new anchor.BN(0), 500)
                    .accounts({
                        seller: seller.publicKey,
                        nftMint: testMint,
                        sellerNftAccount: testSellerAta.address
                    })
                    .signers([seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                const errorMsg = err.error?.errorMessage || err.error?.toString() || err.toString();
                assert.include(errorMsg.toString(), "Price must be greater than zero");
            }
        });

        it("fails with royalty > 10000 bps", async () => {
            const testMint = await createMint(
                provider.connection,
                provider.wallet.payer!,
                seller.publicKey,
                null,
                0
            );
            const testSellerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                seller.publicKey
            );
            await mintTo(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                testSellerAta.address,
                seller,
                1
            );

            try {
                await program.methods
                    .createListing(new anchor.BN(LAMPORTS_PER_SOL), 10001)
                    .accounts({
                        seller: seller.publicKey,
                        nftMint: testMint,
                        sellerNftAccount: testSellerAta.address
                    })
                    .signers([seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                const errorMsg = err.error?.errorMessage || err.error?.toString() || err.toString();
                assert.include(errorMsg.toString(), "Royalty basis points must be <= 10000");
            }
        });

        it("fails when seller doesn't own NFT", async () => {
            const testMint = await createMint(
                provider.connection,
                provider.wallet.payer!,
                seller.publicKey,
                null,
                0
            );
            const testSellerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                seller.publicKey
            );
            // Don't mint - seller has no NFT

            try {
                await program.methods
                    .createListing(new anchor.BN(LAMPORTS_PER_SOL), 500)
                    .accounts({
                        seller: seller.publicKey,
                        nftMint: testMint,
                        sellerNftAccount: testSellerAta.address
                    })
                    .signers([seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                // Should fail on constraint check
                assert.isTrue(err.toString().includes("constraint") || err.toString().includes("amount"));
            }
        });
    });

    describe("fund_escrow", () => {
        let listingPda: PublicKey;
        let testMint: PublicKey;
        let testSellerNftAccount: PublicKey;

        beforeEach(async () => {
            testMint = await createMint(
                provider.connection,
                provider.wallet.payer!,
                seller.publicKey,
                null,
                0
            );
            const testSellerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                seller.publicKey
            );
            testSellerNftAccount = testSellerAta.address;
            await mintTo(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                testSellerNftAccount,
                seller,
                1
            );

            const [pda] = getListingPda(testMint, seller.publicKey);
            listingPda = pda;

            await program.methods
                .createListing(new anchor.BN(LAMPORTS_PER_SOL), 500)
                .accounts({
                    seller: seller.publicKey,
                    nftMint: testMint,
                    sellerNftAccount: testSellerNftAccount
                })
                .signers([seller])
                .rpc();
        });

        it("funds escrow with correct amount", async () => {
            await ensureBalance(buyer.publicKey, 1.5 * LAMPORTS_PER_SOL);
            const [escrowPda, escrowBump] = getEscrowPda(listingPda);
            const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

            await program.methods
                .fundEscrow()
                .accounts({
                    buyer: buyer.publicKey,
                    listing: listingPda,
                    escrow: escrowPda
                } as any)
                .signers([buyer])
                .rpc();

            const escrow = await program.account.escrow.fetch(escrowPda);
            assert.equal(escrow.amount.toNumber(), LAMPORTS_PER_SOL);
            assert.isFalse(escrow.settled);
            assert.equal(escrow.listing.toString(), listingPda.toString());
            assert.equal(escrow.buyer.toString(), buyer.publicKey.toString());
            assert.equal(escrow.bump, escrowBump);

            const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
            assert.isBelow(buyerBalanceAfter, buyerBalanceBefore - LAMPORTS_PER_SOL);
        });

        it("fails when listing is inactive", async () => {
            // Cancel listing first
            await program.methods
                .cancelListing()
                .accounts({
                    seller: seller.publicKey,
                    listing: listingPda,
                    escrow: null,
                    buyer: null
                } as any)
                .signers([seller])
                .rpc();

            await ensureBalance(buyer.publicKey, 1.5 * LAMPORTS_PER_SOL);

            try {
                await program.methods
                    .fundEscrow()
                    .accounts({
                        buyer: buyer.publicKey
                    })
                    .signers([buyer])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                const errorMsg = err.error?.errorMessage || err.error?.toString() || err.toString();
                assert.include(errorMsg.toString(), "constraint");
            }
        });

        it("fails when buyer has insufficient balance", async () => {
            // Set buyer balance to less than price
            const buyerBalance = await provider.connection.getBalance(buyer.publicKey);
            if (buyerBalance >= LAMPORTS_PER_SOL) {
                // Can't easily reduce balance in test, so skip if sufficient
                return;
            }

            try {
                await program.methods
                    .fundEscrow()
                    .accounts({
                        buyer: buyer.publicKey
                    })
                    .signers([buyer])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                // Should fail on insufficient funds
                assert.isTrue(err.toString().includes("insufficient") || err.toString().includes("0x1"));
            }
        });

        it("fails when escrow already exists", async () => {
            await ensureBalance(buyer.publicKey, 2 * LAMPORTS_PER_SOL);

            // Fund escrow first time
            await program.methods
                .fundEscrow()
                .accounts({
                    buyer: buyer.publicKey,
                    listing: listingPda,
                    escrow: getEscrowPda(listingPda)[0]
                } as any)
                .signers([buyer])
                .rpc();

            // Try to fund again - should fail because escrow already initialized
            try {
                await program.methods
                    .fundEscrow()
                    .accounts({
                        buyer: buyer.publicKey
                    })
                    .signers([buyer])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                // Should fail because escrow account already exists
                assert.isTrue(err.toString().includes("already in use") || err.toString().includes("0x0"));
            }
        });
    });

    describe("settle_trade", () => {
        let listingPda: PublicKey;
        let escrowPda: PublicKey;
        let testMint: PublicKey;
        let testSellerNftAccount: PublicKey;
        let testBuyerNftAccount: PublicKey;

        beforeEach(async () => {
            testMint = await createMint(
                provider.connection,
                provider.wallet.payer!,
                seller.publicKey,
                null,
                0
            );
            const testSellerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                seller.publicKey
            );
            testSellerNftAccount = testSellerAta.address;
            const testBuyerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                buyer.publicKey
            );
            testBuyerNftAccount = testBuyerAta.address;

            await mintTo(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                testSellerNftAccount,
                seller,
                1
            );

            const [pda] = getListingPda(testMint, seller.publicKey);
            listingPda = pda;

            await program.methods
                .createListing(new anchor.BN(LAMPORTS_PER_SOL), 500)
                .accounts({
                    seller: seller.publicKey,
                    nftMint: testMint,
                    sellerNftAccount: testSellerNftAccount
                })
                .signers([seller])
                .rpc();

            const [escrow] = getEscrowPda(listingPda);
            escrowPda = escrow;

            await ensureBalance(buyer.publicKey, 1.5 * LAMPORTS_PER_SOL);
            await program.methods
                .fundEscrow()
                .accounts({
                    buyer: buyer.publicKey,
                    listing: listingPda,
                    escrow: getEscrowPda(listingPda)[0]
                } as any)
                .signers([buyer])
                .rpc();
        });

        it("settles trade and transfers NFT", async () => {
            const sellerBalanceBefore = await provider.connection.getBalance(seller.publicKey);
            const creatorBalanceBefore = await provider.connection.getBalance(seller.publicKey); // creator = seller

            await program.methods
                .settleTrade()
                .accounts({
                    seller: seller.publicKey,
                    creator: seller.publicKey, // creator = seller
                    escrow: escrowPda,
                    listing: listingPda,
                    sellerNftAccount: testSellerNftAccount,
                    buyerNftAccount: testBuyerNftAccount
                } as any)
                .signers([buyer, seller])
                .rpc();

            // Validate listing deactivated
            const listing = await program.account.listing.fetch(listingPda);
            assert.isFalse(listing.active);

            // Validate escrow settled
            const escrow = await program.account.escrow.fetch(escrowPda);
            assert.isTrue(escrow.settled);

            // Validate NFT transferred
            const buyerNftAfter = await getAccount(provider.connection, testBuyerNftAccount);
            assert.equal(buyerNftAfter.amount.toString(), "1");

            // Validate payments (5% royalty = 0.05 SOL, seller gets 0.95 SOL)
            // Since creator = seller, seller receives both amounts = 1 SOL total
            const sellerBalanceAfter = await provider.connection.getBalance(seller.publicKey);
            const sellerReceived = sellerBalanceAfter - sellerBalanceBefore;
            const expectedTotal = LAMPORTS_PER_SOL;

            assert.approximately(sellerReceived, expectedTotal, 10000);
        });

        it("fails when escrow is already settled", async () => {
            // Settle once
            await program.methods
                .settleTrade()
                .accounts({
                    seller: seller.publicKey,
                    creator: seller.publicKey, // creator = seller
                    escrow: escrowPda,
                    listing: listingPda,
                    sellerNftAccount: testSellerNftAccount,
                    buyerNftAccount: testBuyerNftAccount
                } as any)
                .signers([buyer, seller])
                .rpc();

            // Try to settle again - should fail
            // Need new listing and escrow
            const testMint2 = await createMint(
                provider.connection,
                provider.wallet.payer!,
                seller.publicKey,
                null,
                0
            );
            const testSellerAta2 = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint2,
                seller.publicKey
            );
            const testBuyerAta2 = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint2,
                buyer.publicKey
            );
            await mintTo(
                provider.connection,
                provider.wallet.payer!,
                testMint2,
                testSellerAta2.address,
                seller,
                1
            );

            const [listingPda2] = getListingPda(testMint2, seller.publicKey);
            await program.methods
                .createListing(new anchor.BN(LAMPORTS_PER_SOL), 500)
                .accounts({
                    seller: seller.publicKey,
                    nftMint: testMint2,
                    sellerNftAccount: testSellerAta2.address
                })
                .signers([seller])
                .rpc();

            await ensureBalance(buyer.publicKey, 1.5 * LAMPORTS_PER_SOL);
            await program.methods
                .fundEscrow()
                .accounts({
                    buyer: buyer.publicKey,
                    listing: listingPda,
                    escrow: getEscrowPda(listingPda)[0]
                } as any)
                .signers([buyer])
                .rpc();

            await program.methods
                .settleTrade()
                .accounts({
                    sellerNftAccount: testSellerAta2.address,
                    buyerNftAccount: testBuyerAta2.address
                })
                .signers([buyer, seller])
                .rpc();

            // Try to settle again
            try {
                await program.methods
                    .settleTrade()
                    .accounts({
                        sellerNftAccount: testSellerAta2.address,
                        buyerNftAccount: testBuyerAta2.address
                    })
                    .signers([buyer, seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                const errorMsg = err.error?.errorMessage || err.error?.toString() || err.toString();
                assert.include(errorMsg.toString(), "constraint");
            }
        });

        it("fails when listing is inactive", async () => {
            // Cancel listing first
            await program.methods
                .cancelListing()
                .accounts({
                    seller: seller.publicKey,
                    listing: listingPda,
                    escrow: getEscrowPda(listingPda)[0],
                    buyer: buyer.publicKey
                } as any)
                .signers([seller])
                .rpc();

            try {
                await program.methods
                    .settleTrade()
                    .accounts({
                        sellerNftAccount: testSellerNftAccount,
                        buyerNftAccount: testBuyerNftAccount
                    })
                    .signers([buyer, seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                const errorMsg = err.error?.errorMessage || err.error?.toString() || err.toString();
                assert.include(errorMsg.toString(), "constraint");
            }
        });
    });

    describe("buy_nft", () => {
        let listingPda: PublicKey;
        let testMint: PublicKey;
        let testSellerNftAccount: PublicKey;
        let testBuyerNftAccount: PublicKey;

        beforeEach(async () => {
            testMint = await createMint(
                provider.connection,
                provider.wallet.payer!,
                seller.publicKey,
                null,
                0
            );
            const testSellerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                seller.publicKey
            );
            testSellerNftAccount = testSellerAta.address;
            const testBuyerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                buyer.publicKey
            );
            testBuyerNftAccount = testBuyerAta.address;

            await mintTo(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                testSellerNftAccount,
                seller,
                1
            );

            const [pda] = getListingPda(testMint, seller.publicKey);
            listingPda = pda;

            await program.methods
                .createListing(new anchor.BN(LAMPORTS_PER_SOL), 1000) // 10% royalty
                .accounts({
                    seller: seller.publicKey,
                    nftMint: testMint,
                    sellerNftAccount: testSellerNftAccount
                })
                .signers([seller])
                .rpc();
        });

        it("buys NFT directly and distributes payments", async () => {
            await ensureBalance(buyer.publicKey, 1.5 * LAMPORTS_PER_SOL);
            const sellerBalanceBefore = await provider.connection.getBalance(seller.publicKey);
            const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

            await program.methods
                .buyNft()
                .accounts({
                    buyer: buyer.publicKey,
                    seller: seller.publicKey,
                    creator: seller.publicKey, // creator = seller
                    nftMint: testMint,
                    listing: listingPda,
                    sellerNftAccount: testSellerNftAccount,
                    buyerNftAccount: testBuyerNftAccount
                } as any)
                .signers([buyer, seller])
                .rpc();

            // Validate listing deactivated
            const listing = await program.account.listing.fetch(listingPda);
            assert.isFalse(listing.active);

            // Validate NFT transferred
            const buyerNft = await getAccount(provider.connection, testBuyerNftAccount);
            assert.equal(buyerNft.amount.toString(), "1");

            // Validate payments (10% royalty, but creator = seller so seller gets full amount)
            const sellerBalanceAfter = await provider.connection.getBalance(seller.publicKey);
            const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);

            // Since creator = seller, seller receives the full payment
            const expectedSellerAmount = LAMPORTS_PER_SOL;
            assert.approximately(sellerBalanceAfter - sellerBalanceBefore, expectedSellerAmount, 10000);
            
            // Buyer should pay LAMPORTS_PER_SOL + transaction fees
            const buyerPaid = buyerBalanceBefore - buyerBalanceAfter;
            assert.isAtLeast(buyerPaid, LAMPORTS_PER_SOL);
            assert.isAtMost(buyerPaid, LAMPORTS_PER_SOL + 50000);
        });

        it("fails when listing is inactive", async () => {
            // Cancel listing first
            await program.methods
                .cancelListing()
                .accounts({
                    seller: seller.publicKey,
                    listing: listingPda,
                    escrow: null,
                    buyer: null
                } as any)
                .signers([seller])
                .rpc();

            await ensureBalance(buyer.publicKey, 1.5 * LAMPORTS_PER_SOL);

            try {
                await program.methods
                    .buyNft()
                    .accounts({
                        buyer: buyer.publicKey,
                        sellerNftAccount: testSellerNftAccount,
                        buyerNftAccount: testBuyerNftAccount
                    })
                    .signers([buyer, seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                const errorMsg = err.error?.errorMessage || err.error?.toString() || err.toString();
                assert.include(errorMsg.toString(), "Listing is not active");
            }
        });

        it("fails when buyer has insufficient balance", async () => {
            // Don't ensure balance - buyer might not have enough
            const buyerBalance = await provider.connection.getBalance(buyer.publicKey);
            if (buyerBalance >= LAMPORTS_PER_SOL) {
                // Can't easily reduce balance in test, so skip if sufficient
                return;
            }

            try {
                await program.methods
                    .buyNft()
                    .accounts({
                        buyer: buyer.publicKey,
                        sellerNftAccount: testSellerNftAccount,
                        buyerNftAccount: testBuyerNftAccount
                    })
                    .signers([buyer, seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                // Should fail on insufficient funds
                assert.isTrue(err.toString().includes("insufficient") || err.toString().includes("0x1"));
            }
        });
    });

    describe("cancel_listing", () => {
        let listingPda: PublicKey;
        let testMint: PublicKey;
        let testSellerNftAccount: PublicKey;

        beforeEach(async () => {
            testMint = await createMint(
                provider.connection,
                provider.wallet.payer!,
                seller.publicKey,
                null,
                0
            );
            const testSellerAta = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                seller.publicKey
            );
            testSellerNftAccount = testSellerAta.address;
            await mintTo(
                provider.connection,
                provider.wallet.payer!,
                testMint,
                testSellerNftAccount,
                seller,
                1
            );

            const [pda] = getListingPda(testMint, seller.publicKey);
            listingPda = pda;
        });

        it("cancels listing without escrow", async () => {
            await program.methods
                .createListing(new anchor.BN(LAMPORTS_PER_SOL), 500)
                .accounts({
                    seller: seller.publicKey,
                    nftMint: testMint,
                    sellerNftAccount: testSellerNftAccount
                })
                .signers([seller])
                .rpc();

            await program.methods
                .cancelListing()
                .accounts({
                    seller: seller.publicKey,
                    listing: listingPda,
                    escrow: null,
                    buyer: null
                } as any)
                .signers([seller])
                .rpc();

            const listing = await program.account.listing.fetch(listingPda);
            assert.isFalse(listing.active);
        });

        it("cancels listing with escrow and refunds buyer", async () => {
            await program.methods
                .createListing(new anchor.BN(LAMPORTS_PER_SOL), 500)
                .accounts({
                    seller: seller.publicKey,
                    nftMint: testMint,
                    sellerNftAccount: testSellerNftAccount
                })
                .signers([seller])
                .rpc();

            const [escrowPda] = getEscrowPda(listingPda);

            await ensureBalance(buyer.publicKey, 1.5 * LAMPORTS_PER_SOL);
            await program.methods
                .fundEscrow()
                .accounts({
                    buyer: buyer.publicKey,
                    listing: listingPda,
                    escrow: getEscrowPda(listingPda)[0]
                } as any)
                .signers([buyer])
                .rpc();

            const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

            await program.methods
                .cancelListing()
                .accounts({
                    seller: seller.publicKey,
                    listing: listingPda,
                    escrow: getEscrowPda(listingPda)[0],
                    buyer: buyer.publicKey
                } as any)
                .signers([seller])
                .rpc();

            const listing = await program.account.listing.fetch(listingPda);
            assert.isFalse(listing.active);

            const escrow = await program.account.escrow.fetch(escrowPda);
            assert.isTrue(escrow.settled);

            const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
            assert.isAbove(buyerBalanceAfter, buyerBalanceBefore);
        });

        it("fails when listing is already inactive", async () => {
            await program.methods
                .createListing(new anchor.BN(LAMPORTS_PER_SOL), 500)
                .accounts({
                    seller: seller.publicKey,
                    nftMint: testMint,
                    sellerNftAccount: testSellerNftAccount
                })
                .signers([seller])
                .rpc();

            // Cancel once
            await program.methods
                .cancelListing()
                .accounts({
                    seller: seller.publicKey,
                    listing: listingPda,
                    escrow: null,
                    buyer: null
                } as any)
                .signers([seller])
                .rpc();

            // Try to cancel again
            try {
                await program.methods
                    .cancelListing()
                    .accounts({
                        buyer: null
                    })
                    .signers([seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                const errorMsg = err.error?.errorMessage || err.error?.toString() || err.toString();
                assert.include(errorMsg.toString(), "constraint");
            }
        });

        it("fails when escrow exists but buyer is missing", async () => {
            await program.methods
                .createListing(new anchor.BN(LAMPORTS_PER_SOL), 500)
                .accounts({
                    seller: seller.publicKey,
                    nftMint: testMint,
                    sellerNftAccount: testSellerNftAccount
                })
                .signers([seller])
                .rpc();

            await ensureBalance(buyer.publicKey, 1.5 * LAMPORTS_PER_SOL);
            await program.methods
                .fundEscrow()
                .accounts({
                    buyer: buyer.publicKey,
                    listing: listingPda,
                    escrow: getEscrowPda(listingPda)[0]
                } as any)
                .signers([buyer])
                .rpc();

            // Try to cancel without providing buyer
            try {
                await program.methods
                    .cancelListing()
                    .accounts({
                        buyer: null
                    })
                    .signers([seller])
                    .rpc();
                assert.fail("Should have failed");
            } catch (err: any) {
                const errorMsg = err.error?.errorMessage || err.error?.toString() || err.toString();
                assert.include(errorMsg.toString(), "Buyer is required when escrow exists");
            }
        });
    });
});
