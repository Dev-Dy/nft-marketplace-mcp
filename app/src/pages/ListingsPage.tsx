import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mcpClient } from '../lib/mcp';
import { ListingState } from '../types/marketplace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export function ListingsPage() {
  const [listings, setListings] = useState<ListingState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement listing discovery (indexer, program logs, etc.)
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground text-lg">Loading listings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold mb-3 gradient-text">Active Listings</h1>
          <p className="text-muted-foreground text-lg">Discover and trade NFTs on Solana</p>
        </div>
        <Link to="/create">
          <Button variant="gradient" size="lg" className="font-semibold">
            + Create Listing
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-semibold mb-2 text-foreground">No listings yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to create a listing!</p>
              <Link to="/create">
                <Button variant="gradient">Create Your First Listing</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.listing_pda}
              to={`/listing/${listing.listing_pda}`}
              className="block transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
            >
              <Card className="h-full group cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">NFT Listing</CardTitle>
                    <Badge variant={listing.active ? "success" : "secondary"}>
                      {listing.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {listing.nft_mint.slice(0, 8)}...{listing.nft_mint.slice(-8)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-white/10">
                      <div className="text-sm text-muted-foreground mb-1">Price</div>
                      <div className="text-3xl font-bold gradient-text">
                        {(listing.price / 1e9).toFixed(2)} SOL
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Royalty</div>
                        <div className="font-semibold">{(listing.royalty_bps / 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Seller</div>
                        <div className="font-mono text-xs">
                          {listing.seller.slice(0, 4)}...{listing.seller.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
