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
          <div className="text-muted-foreground">Loading listing details...</div>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
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
        <Card>
          <CardContent className="pt-6">
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to Listings
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Listing Details</h1>
          <Badge variant={listing.active ? "default" : "secondary"}>
            {listing.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {txStatus && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-primary font-medium">{txStatus}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Listing Information</CardTitle>
            <CardDescription>NFT and seller details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">NFT Mint</div>
              <div className="font-mono text-sm break-all">{listing.nft_mint}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Seller</div>
              <div className="font-mono text-sm">
                {listing.seller.slice(0, 8)}...{listing.seller.slice(-8)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Creator</div>
              <div className="font-mono text-sm">
                {listing.creator.slice(0, 8)}...{listing.creator.slice(-8)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Price and royalty breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Price</div>
              <div className="text-3xl font-bold">
                {(listing.price / 1e9).toFixed(2)} SOL
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Royalty</div>
              <div className="text-xl font-semibold">
                {(listing.royalty_bps / 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {simulation && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Purchase Breakdown</CardTitle>
            <CardDescription>Estimated costs and payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Price</div>
                <div className="text-2xl font-bold">
                  {(simulation.total_price / 1e9).toFixed(4)} SOL
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Royalty</div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {(simulation.royalty_amount / 1e9).toFixed(4)} SOL
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Seller Payout</div>
                <div className="text-2xl font-bold text-primary">
                  {(simulation.seller_payout / 1e9).toFixed(4)} SOL
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasEscrow && (
        <Card className="mt-6 border-primary/20">
          <CardHeader>
            <CardTitle>Escrow Status</CardTitle>
            <CardDescription>Funded escrow awaiting settlement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Buyer</span>
              <span className="font-mono text-sm">
                {escrow!.buyer.slice(0, 8)}...{escrow!.buyer.slice(-8)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-semibold">
                {(escrow!.amount / 1e9).toFixed(4)} SOL
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={escrow!.settled ? "secondary" : "default"}>
                {escrow!.settled ? "Settled" : "Pending"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Available operations for this listing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {!hasEscrow && listing.active && !isSeller && (
              <Button
                onClick={handleFundEscrow}
                disabled={!publicKey || !!txStatus}
                size="lg"
              >
                Fund Escrow
              </Button>
            )}
            {hasEscrow && listing.active && (
              <Button
                onClick={handleSettleTrade}
                disabled={!publicKey || !!txStatus}
                size="lg"
                variant="default"
              >
                Settle Trade
              </Button>
            )}
            {isSeller && listing.active && (
              <Button
                onClick={handleCancelListing}
                disabled={!publicKey || !!txStatus}
                size="lg"
                variant="destructive"
              >
                Cancel Listing
              </Button>
            )}
            {!publicKey && (
              <div className="text-sm text-muted-foreground">
                Connect wallet to perform actions
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
