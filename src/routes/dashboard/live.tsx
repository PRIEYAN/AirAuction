import { createFileRoute } from "@tanstack/react-router";
import { AuctionCard } from "@/components/AuctionCard";
import { useAuctions } from "@/lib/useAuctions";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/dashboard/live")({ component: LivePage });

function LivePage() {
  const { auctions, loading, error } = useAuctions();
  const live = auctions.filter((a) => a.status === "LIVE");
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Live auctions<span className="font-light italic text-white/40"> · {live.length} active</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">Bid in real time. The AI auctioneer is calling each move.</p>
      </header>
      {loading ? (
        <GlassCard className="p-6 text-sm text-white/60">Loading on-chain auctions...</GlassCard>
      ) : error ? (
        <GlassCard className="p-6 text-sm text-red-200">{error}</GlassCard>
      ) : live.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {live.map((a) => <AuctionCard key={a.id} auction={a} />)}
        </div>
      ) : (
        <GlassCard className="p-6 text-sm text-white/60">No live auctions on the configured contract yet.</GlassCard>
      )}
    </div>
  );
}
