import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { MarketplaceClient } from '../lib/anchor';
import { fetchOwnedNFTs, OwnedNFT } from '../lib/nft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/input';

export function CreateListingPage() {
  const navigate = useNavigate();
  const walletState = useWallet();
  const { publicKey } = walletState;
  const { connection } = useConnection();

  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [selectedNft, setSelectedNft] = useState<OwnedNFT | null>(null);
  const [price, setPrice] = useState('');
  const [royaltyBps, setRoyaltyBps] = useState('500'); // Default 5%
  const [loading, setLoading] = useState(false);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Fetch NFTs when wallet connects
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
      const ownedNfts = await fetchOwnedNFTs(connection, publicKey);
      setNfts(ownedNfts);
    } catch (err: any) {
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

      // Validate inputs (frontend validation for UX only - program enforces on-chain)
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

      // Get seller's NFT token account (associated token account)
      const sellerNftAccount = await getAssociatedTokenAddress(selectedNft.mint, publicKey);

      // Create listing - program validates ownership on-chain
      const client = new MarketplaceClient(connection, walletState);
      const tx = await client.createListing(
        publicKey,
        selectedNft.mint,
        sellerNftAccount,
        priceLamports,
        royaltyBpsNum
      );

      setTxStatus(`Transaction confirmed: ${tx.slice(0, 8)}...`);

      // Get listing PDA and navigate to it
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

  // Wallet not connected state
  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6 hover:bg-white/10">
              ← Back to Listings
            </Button>
          </Link>
          <h1 className="text-5xl font-bold mb-3 gradient-text">Create Listing</h1>
          <p className="text-muted-foreground text-lg">
            List your NFT for sale on the marketplace
          </p>
        </div>

        <Card className="glass border-purple-500/30">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-semibold mb-2 text-foreground">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to view and list your NFTs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 hover:bg-white/10">
            ← Back to Listings
          </Button>
        </Link>
        <h1 className="text-5xl font-bold mb-3 gradient-text">Create Listing</h1>
        <p className="text-muted-foreground text-lg">
          Select an NFT from your wallet and set your listing price
        </p>
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

      {/* Step 1: Select NFT */}
      <Card className="mb-6 glass border-purple-500/30">
        <CardHeader>
          <CardTitle>Step 1: Select NFT</CardTitle>
          <CardDescription>Choose an NFT from your wallet to list</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingNfts ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <div className="text-muted-foreground">Loading your NFTs...</div>
              </div>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No NFTs Found</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any NFTs in this wallet
              </p>
              <Button variant="outline" onClick={loadNFTs}>
                Refresh
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {nfts.map((nft) => (
                <button
                  key={nft.mint.toString()}
                  onClick={() => setSelectedNft(nft)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedNft?.mint.toString() === nft.mint.toString()
                      ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/50 scale-105'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-3 flex items-center justify-center">
                    <div className="text-4xl">🖼️</div>
                  </div>
                  <div className="font-mono text-xs break-all text-muted-foreground">
                    {nft.mint.toString().slice(0, 6)}...{nft.mint.toString().slice(-6)}
                  </div>
                  {selectedNft?.mint.toString() === nft.mint.toString() && (
                    <Badge variant="default" className="mt-2">
                      Selected
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Set Price and Royalty */}
      {selectedNft && (
        <Card className="glass border-purple-500/30">
          <CardHeader>
            <CardTitle>Step 2: Set Listing Details</CardTitle>
            <CardDescription>Configure price and royalty for your listing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="text-sm text-muted-foreground mb-1">Selected NFT</div>
              <div className="font-mono text-sm text-foreground">
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
                  <span className="animate-spin">⏳</span>
                  Creating Listing...
                </span>
              ) : (
                '✨ Create Listing'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
