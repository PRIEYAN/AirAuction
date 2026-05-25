import type { Auction } from "@/types/auction";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ChainBadge } from "./ChainBadge";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Gavel, Users } from "lucide-react";

export function AuctionCard({ auction, cta = "Quick Bid" }: { auction: Auction; cta?: string }) {
  const { label } = useCountdown(auction.status === "SCHEDULED" ? auction.startTime : auction.endTime);
  return (
    <GlassCard className="group overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <img src={auction.nft.image} alt={auction.nft.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-x-3 top-3 flex justify-between">
          <StatusBadge status={auction.status} />
          <ChainBadge chain={auction.nft.chain} />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <div className="text-xs text-white/50">{auction.nft.collection}</div>
          <div className="truncate text-base font-semibold text-white">{auction.nft.name}</div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Current Bid</div>
            <div className="text-xl font-bold text-white">{auction.currentBid} ETH</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              {auction.status === "SCHEDULED" ? "Starts in" : "Ends in"}
            </div>
            <div className="font-mono text-sm text-white/90">{label}</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-white/50">
          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{auction.bidCount} bidders</span>
          <span>Reserve {auction.reservePrice} ETH</span>
        </div>
        <Link to="/auction/$id" params={{ id: auction.id }}>
          <Button className="w-full rounded-full bg-white text-black hover:bg-white/90">
            <Gavel className="mr-2 h-4 w-4" />{cta}
          </Button>
        </Link>
      </div>
    </GlassCard>
  );
}
