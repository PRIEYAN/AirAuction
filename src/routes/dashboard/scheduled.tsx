import { createFileRoute } from "@tanstack/react-router";
import { AuctionCard } from "@/components/AuctionCard";
import { useAuctions } from "@/lib/useAuctions";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/dashboard/scheduled")({ component: ScheduledPage });

function ScheduledPage() {
  const { auctions, loading, error } = useAuctions();
  const items = auctions.filter((a) => a.status === "SCHEDULED");
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Scheduled<span className="font-light italic text-white/40"> · upcoming drops</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">Register interest to be notified when these go live.</p>
      </header>
      {loading ? (
        <GlassCard className="p-6 text-sm text-white/60">Loading scheduled auctions...</GlassCard>
      ) : error ? (
        <GlassCard className="p-6 text-sm text-red-200">{error}</GlassCard>
      ) : items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((a) => <AuctionCard key={a.id} auction={a} cta="Register Interest" />)}
        </div>
      ) : (
        <GlassCard className="p-6 text-sm text-white/60">No scheduled auctions on the configured contract yet.</GlassCard>
      )}
    </div>
  );
}
