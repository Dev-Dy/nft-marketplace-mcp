import { motion } from "framer-motion";
import { Image, Sparkles } from "lucide-react";
import { OwnedNFT } from "../lib/nft";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

interface NftCardProps {
  nft: OwnedNFT;
  selected?: boolean;
  onClick?: () => void;
}

export function NftCard({ nft, selected, onClick }: NftCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={onClick}
        className={cn(
          "relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group",
          selected
            ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/50 scale-105"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        )}
      >
        {/* NFT Image Placeholder */}
        <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 mb-3 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 shimmer" />
          <Image className="text-4xl text-purple-400/50 relative z-10" />
          {selected && (
            <div className="absolute top-2 right-2 z-20">
              <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* NFT Info */}
        <div className="space-y-2">
          <div className="font-mono text-xs break-all text-muted-foreground group-hover:text-foreground transition-colors">
            {nft.mint.toString().slice(0, 6)}...{nft.mint.toString().slice(-6)}
          </div>
          {selected && (
            <Badge variant="default" className="mt-2 animate-in">
              Selected
            </Badge>
          )}
        </div>

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute inset-0 rounded-xl border-2 border-purple-500 pointer-events-none">
            <div className="absolute top-0 right-0 w-6 h-6 bg-purple-500 rounded-bl-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
        )}
      </button>
    </motion.div>
  );
}
