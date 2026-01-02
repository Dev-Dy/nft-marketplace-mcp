import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function WalletButton() {
  const { wallet, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!wallet || !publicKey) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          onClick={() => setVisible(true)}
          variant="gradient"
          className="font-semibold"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3"
    >
      <Badge 
        variant="secondary" 
        className="font-mono px-4 py-2 cursor-pointer hover:bg-purple-500/30 transition-colors"
        onClick={copyAddress}
      >
        {copied ? (
          <span className="flex items-center gap-2">
            <Check className="h-3 w-3" />
            Copied!
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            <Copy className="h-3 w-3 opacity-50" />
          </span>
        )}
      </Badge>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={disconnect}
        className="hover:bg-red-500/10 hover:border-red-500/30"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
