import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { mcpClient } from '../lib/mcp';
import { MarketplaceClient } from '../lib/anchor';
import { ListingState, EscrowState, SimulatePurchaseOutput } from '../types/marketplace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export function ListingDetailPage() {
  const { listingPda } = useParams<{ listingPda: string }>();
  const walletState = useWallet();
  const { publicKey } = walletState;
  const { connection } = useConnection();

  const [listing, setListing] = useState<ListingState | null>(null);
  const [escrow, setEscrow] = useState<EscrowState | null>(null);
  const [simulation, setSimulation] = useState<SimulatePurchaseOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!listingPda) return;
    loadListingData();
  }, [listingPda]);

  async function loadListingData() {
    if (!listingPda) return;
    try {
      setLoading(true);
      setError(null);
      const [listingData, simulationData] = await Promise.all([
        mcpClient.getListingState(listingPda),
        mcpClient.simulatePurchase(listingPda),
      ]);
      setListing(listingData);
      setSimulation(simulationData);

      // Try to fetch escrow if it exists
      try {
        const listingPubkey = new PublicKey(listingPda);
        const [escrowPda] = await MarketplaceClient.deriveEscrowPda(listingPubkey);
        const escrowData = await mcpClient.getEscrowState(escrowPda.toString());
        setEscrow(escrowData);
      } catch {
        // Escrow doesn't exist yet
        setEscrow(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFundEscrow() {
    if (!publicKey || !listing) return;
    try {
      setTxStatus('Funding escrow...');
      setError(null);
      const listingPubkey = new PublicKey(listingPda!);
      const [escrowPda] = await MarketplaceClient.deriveEscrowPda(listingPubkey);
      
      const client = new MarketplaceClient(connection, walletState);
      const tx = await client.fundEscrow(publicKey, listingPubkey, escrowPda);
      setTxStatus(`Transaction confirmed: ${tx.slice(0, 8)}...`);
      await loadListingData();
    } catch (err: any) {
      setError(err.message);
      setTxStatus(null);
    }
  }

  async function handleSettleTrade() {
    if (!publicKey || !listing || !escrow) return;
    try {
      setTxStatus('Settling trade...');
      setError(null);
      const listingPubkey = new PublicKey(listingPda!);
      const escrowPubkey = new PublicKey(escrow.escrow_pda);
      const nftMint = new PublicKey(listing.nft_mint);
      const seller = new PublicKey(listing.seller);
      const creator = new PublicKey(listing.creator);

      // Derive token accounts
      const sellerNftAccount = await getAssociatedTokenAddress(nftMint, seller);
      const buyerNftAccount = await getAssociatedTokenAddress(nftMint, publicKey);

      const client = new MarketplaceClient(connection, walletState);
      const tx = await client.settleTrade(
        publicKey,
        seller,
        creator,
        escrowPubkey,
        listingPubkey,
        sellerNftAccount,
        buyerNftAccount
      );
      setTxStatus(`Transaction confirmed: ${tx.slice(0, 8)}...`);
      await loadListingData();
    } catch (err: any) {
      setError(err.message);
      setTxStatus(null);
    }
  }

  async function handleCancelListing() {
    if (!publicKey || !listing) return;
    if (publicKey.toString() !== listing.seller) {
      setError('Only seller can cancel listing');
      return;
    }
    try {
      setTxStatus('Cancelling listing...');
      setError(null);
      const listingPubkey = new PublicKey(listingPda!);
      const escrowPda = escrow ? new PublicKey(escrow.escrow_pda) : null;
      const buyer = escrow ? new PublicKey(escrow.buyer) : null;

      const client = new MarketplaceClient(connection, walletState);
      const tx = await client.cancelListing(publicKey, listingPubkey, escrowPda, buyer);
      setTxStatus(`Transaction confirmed: ${tx.slice(0, 8)}...`);
      await loadListingData();
    } catch (err: any) {
      setError(err.message);
      setTxStatus(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <div className="text-muted-foreground text-lg">Loading listing details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive glass">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-destructive mb-4">{error}</div>
            <Link to="/">
              <Button variant="outline">Back to Listings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass">
          <CardContent className="pt-12 pb-12">
            <div className="text-center py-12 text-muted-foreground">
              Listing not found
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSeller = publicKey?.toString() === listing.seller;
  const hasEscrow = escrow !== null && !escrow.settled;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 hover:bg-white/10">
            ← Back to Listings
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-5xl font-bold gradient-text">Listing Details</h1>
          <Badge variant={listing.active ? "success" : "secondary"} className="text-sm px-4 py-2">
            {listing.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 glass bg-red-500/10">
          <CardContent className="pt-6">
            <div className="text-destructive font-medium">{error}</div>
          </CardContent>
        </Card>
      )}

      {txStatus && (
        <Card className="mb-6 border-purple-500/50 glass bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              <div className="text-purple-300 font-medium">{txStatus}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="glass hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
          <CardHeader>
            <CardTitle>Listing Information</CardTitle>
            <CardDescription>NFT and seller details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-muted-foreground mb-2">NFT Mint</div>
              <div className="font-mono text-sm break-all text-foreground">{listing.nft_mint}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-muted-foreground mb-1">Seller</div>
                <div className="font-mono text-sm">
                  {listing.seller.slice(0, 6)}...{listing.seller.slice(-6)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-muted-foreground mb-1">Creator</div>
                <div className="font-mono text-sm">
                  {listing.creator.slice(0, 6)}...{listing.creator.slice(-6)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Price and royalty breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="text-sm text-muted-foreground mb-2">Price</div>
              <div className="text-4xl font-bold gradient-text">
                {(listing.price / 1e9).toFixed(2)} SOL
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-muted-foreground mb-1">Royalty</div>
              <div className="text-2xl font-semibold text-purple-300">
                {(listing.royalty_bps / 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {simulation && (
        <Card className="mb-6 glass border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <CardHeader>
            <CardTitle>Purchase Breakdown</CardTitle>
            <CardDescription>Estimated costs and payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-sm text-muted-foreground mb-2">Total Price</div>
                <div className="text-2xl font-bold gradient-text">
                  {(simulation.total_price / 1e9).toFixed(4)} SOL
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-sm text-muted-foreground mb-2">Royalty</div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {(simulation.royalty_amount / 1e9).toFixed(4)} SOL
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <div className="text-sm text-muted-foreground mb-2">Seller Payout</div>
                <div className="text-2xl font-bold gradient-text">
                  {(simulation.seller_payout / 1e9).toFixed(4)} SOL
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasEscrow && (
        <Card className="mb-6 glass border-purple-500/30 bg-purple-500/5">
          <CardHeader>
            <CardTitle>Escrow Status</CardTitle>
            <CardDescription>Funded escrow awaiting settlement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-muted-foreground mb-1">Buyer</div>
                <div className="font-mono text-sm">
                  {escrow!.buyer.slice(0, 6)}...{escrow!.buyer.slice(-6)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <div className="text-xs text-muted-foreground mb-1">Amount</div>
                <div className="text-lg font-bold gradient-text">
                  {(escrow!.amount / 1e9).toFixed(4)} SOL
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <Badge variant={escrow!.settled ? "secondary" : "success"} className="mt-1">
                  {escrow!.settled ? "Settled" : "Pending"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass border-purple-500/30">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Available operations for this listing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {!hasEscrow && listing.active && !isSeller && (
              <Button
                onClick={handleFundEscrow}
                disabled={!publicKey || !!txStatus}
                size="lg"
                variant="gradient"
                className="font-semibold"
              >
                💰 Fund Escrow
              </Button>
            )}
            {hasEscrow && listing.active && (
              <Button
                onClick={handleSettleTrade}
                disabled={!publicKey || !!txStatus}
                size="lg"
                variant="gradient"
                className="font-semibold"
              >
                ✅ Settle Trade
              </Button>
            )}
            {isSeller && listing.active && (
              <Button
                onClick={handleCancelListing}
                disabled={!publicKey || !!txStatus}
                size="lg"
                variant="destructive"
                className="font-semibold"
              >
                🗑️ Cancel Listing
              </Button>
            )}
            {!publicKey && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 rounded-lg bg-white/5 border border-white/10">
                <span>🔒</span>
                <span>Connect wallet to perform actions</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
