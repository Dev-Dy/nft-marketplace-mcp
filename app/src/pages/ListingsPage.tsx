import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mcpClient } from '../lib/mcp';
import { ListingState } from '../types/marketplace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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
          <div className="text-muted-foreground">Loading listings...</div>
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Active Listings</h1>
        <p className="text-muted-foreground">Browse available NFT listings</p>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              No active listings found
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.listing_pda}
              to={`/listing/${listing.listing_pda}`}
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">NFT Listing</CardTitle>
                    <Badge variant={listing.active ? "default" : "secondary"}>
                      {listing.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {listing.nft_mint.slice(0, 8)}...{listing.nft_mint.slice(-8)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="text-2xl font-bold">
                        {(listing.price / 1e9).toFixed(2)} SOL
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Royalty</span>
                      <span>{(listing.royalty_bps / 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Seller</span>
                      <span className="font-mono text-xs">
                        {listing.seller.slice(0, 4)}...{listing.seller.slice(-4)}
                      </span>
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
