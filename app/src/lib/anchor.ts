// Anchor client for transaction submission
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import idl from '../idl/marketplace.json';

const PROGRAM_ID = new PublicKey('Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6');

// Convert wallet adapter to Anchor Wallet
function toAnchorWallet(wallet: WalletContextState): Wallet {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error('Wallet not connected');
  }
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
  };
}

export class MarketplaceClient {
  private program: Program;
  private connection: Connection;

  constructor(connection: Connection, wallet: WalletContextState) {
    const anchorWallet = toAnchorWallet(wallet);
    const provider = new AnchorProvider(connection, anchorWallet, {
      commitment: 'confirmed',
    });
    this.program = new Program(idl as any, PROGRAM_ID, provider);
    this.connection = connection;
  }

  async fundEscrow(buyer: PublicKey, listingPda: PublicKey, escrowPda: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .fundEscrow()
      .accounts({
        buyer: buyer,
        listing: listingPda,
        escrow: escrowPda,
      })
      .rpc();
    
    // Wait for confirmation
    await this.connection.confirmTransaction(tx, 'confirmed');
    return tx;
  }

  async settleTrade(
    buyer: PublicKey,
    seller: PublicKey,
    creator: PublicKey,
    escrowPda: PublicKey,
    listingPda: PublicKey,
    sellerNftAccount: PublicKey,
    buyerNftAccount: PublicKey
  ): Promise<string> {
    const tx = await this.program.methods
      .settleTrade()
      .accounts({
        buyer: buyer,
        seller: seller,
        creator: creator,
        escrow: escrowPda,
        listing: listingPda,
        sellerNftAccount: sellerNftAccount,
        buyerNftAccount: buyerNftAccount,
      })
      .signers([])
      .rpc();
    
    await this.connection.confirmTransaction(tx, 'confirmed');
    return tx;
  }

  async cancelListing(
    seller: PublicKey,
    listingPda: PublicKey,
    escrowPda: PublicKey | null,
    buyer: PublicKey | null
  ): Promise<string> {
    const accounts: any = {
      seller: seller,
      listing: listingPda,
      escrow: escrowPda,
      buyer: buyer,
    };
    
    const tx = await this.program.methods
      .cancelListing()
      .accounts(accounts)
      .rpc();
    
    await this.connection.confirmTransaction(tx, 'confirmed');
    return tx;
  }

  async buyNft(
    buyer: PublicKey,
    seller: PublicKey,
    creator: PublicKey,
    nftMint: PublicKey,
    listingPda: PublicKey,
    sellerNftAccount: PublicKey,
    buyerNftAccount: PublicKey
  ): Promise<string> {
    const tx = await this.program.methods
      .buyNft()
      .accounts({
        buyer: buyer,
        seller: seller,
        creator: creator,
        nftMint: nftMint,
        listing: listingPda,
        sellerNftAccount: sellerNftAccount,
        buyerNftAccount: buyerNftAccount,
      })
      .rpc();
    
    await this.connection.confirmTransaction(tx, 'confirmed');
    return tx;
  }

  // Helper to derive PDAs
  static async deriveListingPda(nftMint: PublicKey, seller: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('listing'),
        nftMint.toBuffer(),
        seller.toBuffer(),
      ],
      PROGRAM_ID
    );
  }

  static async deriveEscrowPda(listingPda: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), listingPda.toBuffer()],
      PROGRAM_ID
    );
  }
}
