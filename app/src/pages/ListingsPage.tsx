import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Sparkles, TrendingUp } from 'lucide-react';
// Listing discovery will be implemented via indexer or program logs
import { ListingState } from '../types/marketplace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

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
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass">
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive glass">
          <CardContent className="pt-6">
            <div className="text-destructive">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-5xl font-bold gradient-text">Active Listings</h1>
                <p className="text-muted-foreground text-lg mt-1">Discover and trade NFTs on Solana</p>
              </div>
            </div>
          </div>
          <Link to="/create">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="gradient" size="lg" className="font-semibold">
                <Plus className="h-5 w-5 mr-2" />
                Create Listing
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search listings..."
              className="w-full pl-10 pr-4 py-2 glass border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </motion.div>

      {listings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-dashed glass">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/20 mb-6">
                  <Sparkles className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-foreground">No listings yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to create a listing!</p>
                <Link to="/create">
                  <Button variant="gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.listing_pda}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/listing/${listing.listing_pda}`}
                className="block"
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full group cursor-pointer glass border-white/10 hover:border-purple-500/50 transition-all duration-300">
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
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
