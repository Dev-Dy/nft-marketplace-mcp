import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wallet, AlertCircle, CheckCircle2, Coins, TrendingUp, User, Crown, Loader2, DollarSign, Percent, X } from 'lucide-react';
import { MarketplaceClient } from '../lib/anchor';
import { getListingState, getEscrowState, simulatePurchase } from '../lib/data';
import { ListingState, EscrowState, SimulatePurchaseOutput } from '../types/marketplace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, Skeleton } from '../components/ui/loading';

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
      
      // Fetch listing state (read-only, doesn't need wallet)
      const listingData = await getListingState(connection, listingPda);
      setListing(listingData);
      
      // Calculate purchase simulation
      const simulationData = simulatePurchase(listingData);
      setSimulation(simulationData);

      // Try to fetch escrow
      try {
        const listingPubkey = new PublicKey(listingPda);
        const [escrowPda] = MarketplaceClient.deriveEscrowPda(listingPubkey);
        const escrowData = await getEscrowState(connection, escrowPda.toString());
        setEscrow(escrowData);
      } catch {
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
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-12 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
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
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <div>{error}</div>
            </div>
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-5xl font-bold gradient-text">Listing Details</h1>
              <p className="text-muted-foreground text-lg mt-1">View and interact with this NFT listing</p>
            </div>
          </div>
          <Badge variant={listing.active ? "success" : "secondary"} className="text-sm px-4 py-2">
            {listing.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Card className="border-destructive/50 glass bg-red-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive font-medium">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {txStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Card className="border-purple-500/50 glass bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <LoadingSpinner className="h-5 w-5" />
                  <div className="text-purple-300 font-medium">{txStatus}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass hover:shadow-2xl hover:shadow-purple-500/10 transition-all h-full">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-purple-400" />
                <CardTitle>Listing Information</CardTitle>
              </div>
              <CardDescription>NFT and seller details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-sm text-muted-foreground mb-2">NFT Mint</div>
                <div className="font-mono text-sm break-all text-foreground">{listing.nft_mint}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <User className="h-3 w-3" />
                    Seller
                  </div>
                  <div className="font-mono text-sm">
                    {listing.seller.slice(0, 6)}...{listing.seller.slice(-6)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Crown className="h-3 w-3" />
                    Creator
                  </div>
                  <div className="font-mono text-sm">
                    {listing.creator.slice(0, 6)}...{listing.creator.slice(-6)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass hover:shadow-2xl hover:shadow-purple-500/10 transition-all h-full">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-purple-400" />
                <CardTitle>Pricing</CardTitle>
              </div>
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Percent className="h-4 w-4" />
                  Royalty
                </div>
                <div className="text-2xl font-semibold text-purple-300">
                  {(listing.royalty_bps / 100).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {simulation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="glass border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-purple-400" />
                <CardTitle>Purchase Breakdown</CardTitle>
              </div>
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
        </motion.div>
      )}

      {hasEscrow && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Card className="glass border-purple-500/30 bg-purple-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-400" />
                <CardTitle>Escrow Status</CardTitle>
              </div>
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
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass border-purple-500/30">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Available operations for this listing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {!hasEscrow && listing.active && !isSeller && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleFundEscrow}
                    disabled={!publicKey || !!txStatus}
                    size="lg"
                    variant="gradient"
                    className="font-semibold"
                  >
                    <Coins className="h-5 w-5 mr-2" />
                    Fund Escrow
                  </Button>
                </motion.div>
              )}
              {hasEscrow && listing.active && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSettleTrade}
                    disabled={!publicKey || !!txStatus}
                    size="lg"
                    variant="gradient"
                    className="font-semibold"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Settle Trade
                  </Button>
                </motion.div>
              )}
              {isSeller && listing.active && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleCancelListing}
                    disabled={!publicKey || !!txStatus}
                    size="lg"
                    variant="destructive"
                    className="font-semibold"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel Listing
                  </Button>
                </motion.div>
              )}
              {!publicKey && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 rounded-lg bg-white/5 border border-white/10">
                  <Wallet className="h-4 w-4" />
                  <span>Connect wallet to perform actions</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
