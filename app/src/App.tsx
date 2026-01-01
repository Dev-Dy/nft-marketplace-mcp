import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletContextProvider } from './lib/wallet';
import { WalletButton } from './components/WalletButton';
import { ListingsPage } from './pages/ListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';

function App() {
  return (
    <WalletContextProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background relative overflow-hidden">
          {/* Animated background gradient */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 animate-pulse-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
          </div>

          <header className="glass-strong border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold gradient-text">NFT Marketplace</h1>
                <WalletButton />
              </div>
            </div>
          </header>
          <main className="relative z-10">
            <Routes>
              <Route path="/" element={<ListingsPage />} />
              <Route path="/listing/:listingPda" element={<ListingDetailPage />} />
              <Route path="/create" element={<CreateListingPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WalletContextProvider>
  );
}

export default App;
