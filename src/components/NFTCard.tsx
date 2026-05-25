import type { NFT } from "@/types/auction";
import { GlassCard } from "./GlassCard";
import { ChainBadge } from "./ChainBadge";

export function NFTCard({ nft, onClick, selected }: { nft: NFT; onClick?: () => void; selected?: boolean }) {
  return (
    <GlassCard
      onClick={onClick}
      className={`cursor-pointer overflow-hidden transition hover:border-white/30 ${selected ? "ring-2 ring-white" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img src={nft.image} alt={nft.name} className="h-full w-full object-cover" />
        <div className="absolute right-3 top-3"><ChainBadge chain={nft.chain} /></div>
      </div>
      <div className="space-y-2 p-4">
        <div>
          <div className="text-xs text-white/50">{nft.collection}</div>
          <div className="truncate text-sm font-semibold text-white">{nft.name}</div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-lg font-bold text-white">{nft.estimatedValueEth} ETH</div>
          <div className="text-xs text-white/40">${nft.estimatedValueUsd.toLocaleString()}</div>
        </div>
      </div>
    </GlassCard>
  );
}
