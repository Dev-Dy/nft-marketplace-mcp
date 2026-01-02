import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wallet, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { MarketplaceClient } from '../lib/anchor';
import { fetchOwnedNFTs, OwnedNFT } from '../lib/nft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { NftCard } from '../components/NftCard';
import { NftCardSkeleton } from '../components/NftCardSkeleton';
import { LoadingSpinner } from '../components/ui/loading';

export function CreateListingPage() {
  const navigate = useNavigate();
  const walletState = useWallet();
  const { publicKey } = walletState;
  const { connection } = useConnection();

  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [selectedNft, setSelectedNft] = useState<OwnedNFT | null>(null);
  const [price, setPrice] = useState('');
  const [royaltyBps, setRoyaltyBps] = useState('500');
  const [loading, setLoading] = useState(false);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      loadNFTs();
    } else {
      setNfts([]);
      setSelectedNft(null);
    }
  }, [publicKey, connection]);

  async function loadNFTs() {
    if (!publicKey) return;
    
    try {
      setLoadingNfts(true);
      setError(null);
      console.log('Loading NFTs for wallet:', publicKey.toString());
      console.log('Connection endpoint:', connection.rpcEndpoint);
      const ownedNfts = await fetchOwnedNFTs(connection, publicKey);
      console.log('Loaded NFTs:', ownedNfts.length);
      setNfts(ownedNfts);
      if (ownedNfts.length === 0) {
        setError('No NFTs found. Make sure you are connected to devnet and have NFTs in this wallet.');
      }
    } catch (err: any) {
      console.error('Error loading NFTs:', err);
      setError(`Failed to load NFTs: ${err.message}`);
    } finally {
      setLoadingNfts(false);
    }
  }

  async function handleCreateListing() {
    if (!publicKey || !selectedNft) {
      setError('Please connect wallet and select an NFT');
      return;
    }

    if (!price || !royaltyBps) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTxStatus('Creating listing...');

      const priceLamports = Math.floor(parseFloat(price) * 1e9);
      const royaltyBpsNum = parseInt(royaltyBps);

      if (priceLamports <= 0 || isNaN(priceLamports)) {
        setError('Price must be greater than 0');
        setLoading(false);
        return;
      }

      if (isNaN(royaltyBpsNum) || royaltyBpsNum < 0 || royaltyBpsNum > 10000) {
        setError('Royalty must be between 0 and 10000 basis points (0-100%)');
        setLoading(false);
        return;
      }

      const sellerNftAccount = await getAssociatedTokenAddress(selectedNft.mint, publicKey);

      const client = new MarketplaceClient(connection, walletState);
      const tx = await client.createListing(
        publicKey,
        selectedNft.mint,
        sellerNftAccount,
        priceLamports,
        royaltyBpsNum
      );

      setTxStatus(`Transaction confirmed: ${tx.slice(0, 8)}...`);

      const [listingPda] = MarketplaceClient.deriveListingPda(selectedNft.mint, publicKey);
      setTimeout(() => {
        navigate(`/listing/${listingPda.toString()}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
      setTxStatus(null);
    } finally {
      setLoading(false);
    }
  }

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
          </Link>
          <h1 className="text-5xl font-bold mb-3 gradient-text">Create Listing</h1>
          <p className="text-muted-foreground text-lg">
            List your NFT for sale on the marketplace
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-purple-500/30 mt-8">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/20 mb-6">
                  <Wallet className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-foreground">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Please connect your wallet to view and list your NFTs
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
        <div className="flex items-center gap-3 mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Plus className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-5xl font-bold gradient-text">Create Listing</h1>
            <p className="text-muted-foreground text-lg mt-1">
              Select an NFT from your wallet and set your listing price
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="mb-6 border-destructive/50 glass bg-red-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div className="text-destructive font-medium">{error}</div>
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
          >
            <Card className="mb-6 border-purple-500/50 glass bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {loading ? (
                    <LoadingSpinner className="h-5 w-5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-purple-300" />
                  )}
                  <div className="text-purple-300 font-medium">{txStatus}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 1: Select NFT */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-purple-500/30 h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20">
                  <span className="text-purple-400 font-bold">1</span>
                </div>
                <div>
                  <CardTitle>Select NFT</CardTitle>
                  <CardDescription>Choose an NFT from your wallet to list</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingNfts ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <NftCardSkeleton key={i} />
                  ))}
                </div>
              ) : nfts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
                    <AlertCircle className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">No NFTs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any NFTs in this wallet
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4 text-left">
                    <p className="text-sm text-yellow-300 mb-2">
                      <strong>Connected Wallet:</strong> {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      If you minted NFTs to a different wallet, import that wallet or mint new NFTs to this one.
                    </p>
                  </div>
                  <Button variant="outline" onClick={loadNFTs}>
                    <Loader2 className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 max-h-[600px] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {nfts.map((nft, index) => (
                      <motion.div
                        key={nft.mint.toString()}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <NftCard
                          nft={nft}
                          selected={selectedNft?.mint.toString() === nft.mint.toString()}
                          onClick={() => setSelectedNft(nft)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 2: Set Price and Royalty */}
        <AnimatePresence>
          {selectedNft && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass border-purple-500/30">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/20">
                      <span className="text-pink-400 font-bold">2</span>
                    </div>
                    <div>
                      <CardTitle>Listing Details</CardTitle>
                      <CardDescription>Configure price and royalty for your listing</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <div className="text-sm text-muted-foreground">Selected NFT</div>
                    </div>
                    <div className="font-mono text-sm text-foreground break-all">
                      {selectedNft.mint.toString()}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">
                      Price (SOL) *
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.0"
                      disabled={loading}
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      The price you want to sell your NFT for
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">
                      Royalty (basis points) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="10000"
                      value={royaltyBps}
                      onChange={(e) => setRoyaltyBps(e.target.value)}
                      placeholder="500"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Royalty in basis points (100 = 1%, 500 = 5%, 10000 = 100%). Default: 500 (5%)
                    </p>
                  </div>

                  <Button
                    onClick={handleCreateListing}
                    disabled={loading || !price || parseFloat(price) <= 0 || !royaltyBps}
                    size="lg"
                    variant="gradient"
                    className="w-full font-semibold"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <LoadingSpinner className="h-5 w-5" />
                        Creating Listing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Create Listing
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
