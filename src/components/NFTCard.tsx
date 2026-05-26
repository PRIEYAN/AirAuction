import type { NFT } from "@/types/auction";
import { ChainBadge } from "./ChainBadge";

export function NFTCard({ nft, onClick, selected }: { nft: NFT; onClick?: () => void; selected?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-2xl border bg-white/[0.03] hover:border-white/25 ${
        selected ? "border-white" : "border-white/10"
      }`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img src={nft.image} alt={nft.name} className="h-full w-full object-cover" />
        <div className="absolute right-3 top-3"><ChainBadge chain={nft.chain} /></div>
      </div>
      <div className="space-y-2 p-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">{nft.collection}</div>
          <div className="mt-0.5 truncate text-sm font-semibold text-white">{nft.name}</div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-lg font-bold text-white">{nft.estimatedValueEth} ETH</div>
          <div className="text-xs text-white/40">${nft.estimatedValueUsd.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
