// Direct Anchor/RPC data fetching
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import idl from '../idl/marketplace.json';
import { ListingState, EscrowState, SimulatePurchaseOutput } from '../types/marketplace';
import { MarketplaceClient } from './anchor';

const PROGRAM_ID = new PublicKey('Cm3Lzjt4v9xXagssv5f134Q6BnpMVtb9xqovMvPojGc6');

// Create a dummy wallet for read-only operations
function createDummyWallet(): Wallet {
  const dummyKeypair = Keypair.generate();
  return {
    publicKey: dummyKeypair.publicKey,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
}

// Create program instance for account fetching (read-only, doesn't need real wallet)
function getProgram(connection: Connection): Program {
  const dummyWallet = createDummyWallet();
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
  });
  return new Program(idl as any, PROGRAM_ID, provider);
}

export async function getListingState(
  connection: Connection,
  listingPda: string
): Promise<ListingState> {
  try {
    const program = getProgram(connection);
    
    // Fetch listing account data
    const listingAccount = await program.account.listing.fetch(listingPda);
    
    // Convert to ListingState format
    return {
      listing_pda: listingPda,
      seller: listingAccount.seller.toString(),
      nft_mint: listingAccount.nftMint.toString(),
      price: listingAccount.price.toNumber(),
      royalty_bps: listingAccount.royaltyBps,
      creator: listingAccount.creator.toString(),
      active: listingAccount.active,
      bump: listingAccount.bump,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch listing: ${error.message}`);
  }
}

export async function getEscrowState(
  connection: Connection,
  escrowPda: string
): Promise<EscrowState | null> {
  try {
    const program = getProgram(connection);
    
    // Fetch escrow account data
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    
    // Convert to EscrowState format
    return {
      escrow_pda: escrowPda,
      listing: escrowAccount.listing.toString(),
      buyer: escrowAccount.buyer.toString(),
      amount: escrowAccount.amount.toNumber(),
      settled: escrowAccount.settled,
      bump: escrowAccount.bump,
    };
  } catch (error: any) {
    // Account doesn't exist or other error
    if (error.message?.includes('Account does not exist') || 
        error.message?.includes('Invalid account data')) {
      return null;
    }
    throw new Error(`Failed to fetch escrow: ${error.message}`);
  }
}

export function simulatePurchase(listing: ListingState): SimulatePurchaseOutput {
  // Calculate purchase breakdown from listing data
  const totalPrice = listing.price;
  const royaltyAmount = Math.floor((totalPrice * listing.royalty_bps) / 10000);
  const sellerPayout = totalPrice - royaltyAmount;

  return {
    listing_active: listing.active,
    total_price: totalPrice,
    royalty_amount: royaltyAmount,
    seller_payout: sellerPayout,
    royalty_bps: listing.royalty_bps,
  };
}

export async function getListingSummary(
  connection: Connection,
  nftMint: string,
  seller: string
): Promise<ListingState | null> {
  try {
    const nftMintPubkey = new PublicKey(nftMint);
    const sellerPubkey = new PublicKey(seller);
    
    // Derive listing PDA
    const [listingPda] = MarketplaceClient.deriveListingPda(nftMintPubkey, sellerPubkey);
    
    // Fetch listing state
    return await getListingState(connection, listingPda.toString());
  } catch (error: any) {
    if (error.message?.includes('Account does not exist') || 
        error.message?.includes('Invalid account data')) {
      return null;
    }
    throw error;
  }
}

export async function validateListing(
  connection: Connection,
  listingPda: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    const listing = await getListingState(connection, listingPda);
    
    if (!listing.active) {
      errors.push('Listing is not active');
    }
    
    if (listing.price <= 0) {
      errors.push('Listing price must be greater than 0');
    }
    
    if (listing.royalty_bps < 0 || listing.royalty_bps > 10000) {
      errors.push('Royalty must be between 0 and 10000 basis points');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [error.message || 'Failed to validate listing'],
    };
  }
}
