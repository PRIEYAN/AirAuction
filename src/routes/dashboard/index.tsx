import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { AuctionCard } from "@/components/AuctionCard";
import { useAuctions } from "@/hooks/useAuctions";
import { useWallet } from "@/providers/WalletProvider";
import { fetchWalletNfts } from "@/services/nftApi";
import { useEffect, useState } from "react";
import { Image, Gavel, Coins, Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({ component: Overview });

function Overview() {
  const { address, connected } = useWallet();
  const { auctions } = useAuctions();
  const [nftCount, setNftCount] = useState(0);
  const live = auctions.filter((a) => a.status === "LIVE").slice(0, 3);
  const myAuctions = auctions.filter((auction) => auction.seller.toLowerCase() === address.toLowerCase());
  const earnings = myAuctions
    .filter((a) => a.status === "ENDED")
    .reduce((s, a) => s + a.currentBid, 0);

  useEffect(() => {
    if (!connected || !address) return;
    fetchWalletNfts(address).then((items) => setNftCount(items.length)).catch(() => setNftCount(0));
  }, [address, connected]);

  return (
    <div className="space-y-10">
      <header>
        <div className="text-sm text-white/50">Welcome back</div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Your floor<span className="font-light italic text-white/40"> at a glance.</span>
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Image} label="NFTs Owned" value={nftCount.toString()} sub="From connected wallet" />
        <SummaryCard icon={Gavel} label="My Auctions" value={myAuctions.length.toString()} sub="Created on contract" />
        <SummaryCard icon={Coins} label="Total Earnings" value={`${earnings.toFixed(2)} ETH`} sub="From closed auctions" />
        <SummaryCard icon={Trophy} label="Live Rooms" value={live.length.toString()} sub="Calling now" />
      </div>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Live now</h2>
          <Link to="/dashboard/live" className="text-sm text-white/50 hover:text-white">View all →</Link>
        </div>
        {live.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((a) => <AuctionCard key={a.id} auction={a} />)}
          </div>
        ) : (
          <GlassCard className="p-6 text-sm text-white/60">No live auctions on the configured contract yet.</GlassCard>
        )}
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
