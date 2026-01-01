// NFT fetching utilities - fetch NFTs owned by wallet
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface OwnedNFT {
  mint: PublicKey;
  tokenAccount: PublicKey;
  amount: number;
}

// Fetch all NFTs owned by a wallet
export async function fetchOwnedNFTs(
  connection: Connection,
  owner: PublicKey
): Promise<OwnedNFT[]> {
  try {
    // Get all token accounts owned by the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      owner,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    // Filter for NFTs (amount = 1, decimals = 0)
    const nfts: OwnedNFT[] = [];
    
    for (const accountInfo of tokenAccounts.value) {
      const parsedInfo = accountInfo.account.data.parsed.info;
      const mint = new PublicKey(parsedInfo.mint);
      const amount = parsedInfo.tokenAmount.uiAmount;
      const decimals = parsedInfo.tokenAmount.decimals;

      // NFT criteria: amount = 1 and decimals = 0
      if (amount === 1 && decimals === 0) {
        nfts.push({
          mint,
          tokenAccount: accountInfo.pubkey,
          amount: 1,
        });
      }
    }

    return nfts;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}
