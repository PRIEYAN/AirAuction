import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { AuctionCard } from "@/components/AuctionCard";
import { auctions, myBidHistory, myNFTs, myAuctions, mockWallet } from "@/lib/mockData";
import { Image, Gavel, Coins, Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({ component: Overview });

function Overview() {
  const live = auctions.filter((a) => a.status === "LIVE").slice(0, 3);
  const recentBids = myBidHistory.slice(0, 3);
  const earnings = myAuctions
    .filter((a) => a.status === "ENDED")
    .reduce((s, a) => s + a.currentBid, 0);
  const won = myBidHistory.filter((b) => b.result === "WON").length;

  return (
    <div className="space-y-10">
      <header>
        <div className="text-sm text-white/50">Welcome back</div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Your floor<span className="font-light italic text-white/40"> at a glance.</span>
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Image} label="NFTs Owned" value={mockWallet.totalNFTs.toString()} sub={`${mockWallet.totalValueEth} ETH total`} />
        <SummaryCard icon={Gavel} label="Active Bids" value={myBidHistory.filter(b => b.result === "OUTBID").length.toString()} sub="In play right now" />
        <SummaryCard icon={Coins} label="Total Earnings" value={`${earnings.toFixed(2)} ETH`} sub="From closed auctions" />
        <SummaryCard icon={Trophy} label="Auctions Won" value={won.toString()} sub="As a bidder" />
      </div>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Live now</h2>
          <Link to="/dashboard/live" className="text-sm text-white/50 hover:text-white">View all →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((a) => <AuctionCard key={a.id} auction={a} />)}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Recent bids</h2>
          <Link to="/dashboard/bids" className="text-sm text-white/50 hover:text-white">View all →</Link>
        </div>
        <GlassCard className="divide-y divide-white/5">
          {recentBids.map((b) => (
            <div key={b.id} className="flex items-center gap-4 p-4">
              <img src={b.nft.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{b.nft.name}</div>
                <div className="text-xs text-white/40">{b.nft.collection}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{b.myBid} ETH</div>
                <div className={`text-[10px] uppercase tracking-wider ${
                  b.result === "WON" ? "text-emerald-400" : b.result === "OUTBID" ? "text-amber-400" : "text-white/40"
                }`}>{b.result}</div>
              </div>
            </div>
          ))}
        </GlassCard>
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
        <Icon className="h-4 w-4 text-white/40" />
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-white/40">{sub}</div>
    </GlassCard>
  );
}
