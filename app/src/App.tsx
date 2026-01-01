import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletContextProvider } from './lib/wallet';
import { WalletButton } from './components/WalletButton';
import { ListingsPage } from './pages/ListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';

function App() {
  return (
    <WalletContextProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">NFT Marketplace</h1>
                <WalletButton />
              </div>
            </div>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<ListingsPage />} />
              <Route path="/listing/:listingPda" element={<ListingDetailPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WalletContextProvider>
  );
}

export default App;
