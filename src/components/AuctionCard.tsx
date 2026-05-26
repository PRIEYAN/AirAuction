import type { Auction } from "@/types/auction";
import { StatusBadge } from "./StatusBadge";
import { ChainBadge } from "./ChainBadge";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Gavel, Users } from "lucide-react";

export function AuctionCard({ auction, cta = "Quick Bid" }: { auction: Auction; cta?: string }) {
  const { label } = useCountdown(auction.status === "SCHEDULED" ? auction.startTime : auction.endTime);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={auction.nft.image}
          alt={auction.nft.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-3 top-3 flex justify-between">
          <StatusBadge status={auction.status} />
          <ChainBadge chain={auction.nft.chain} />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">{auction.nft.collection}</div>
          <div className="mt-0.5 truncate text-base font-semibold text-white">{auction.nft.name}</div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Current Bid</div>
            <div className="text-xl font-bold text-white">{auction.currentBid} ETH</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
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
    </div>
  );
}
