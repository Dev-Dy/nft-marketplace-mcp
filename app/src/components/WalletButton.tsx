import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function WalletButton() {
  const { wallet, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  if (!wallet || !publicKey) {
    return (
      <Button 
        onClick={() => setVisible(true)}
        variant="gradient"
        className="font-semibold"
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Badge variant="secondary" className="font-mono px-4 py-2">
        {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
      </Badge>
      <Button variant="outline" size="sm" onClick={disconnect}>
        Disconnect
      </Button>
    </div>
  );
}
