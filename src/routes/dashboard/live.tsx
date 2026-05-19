import { createFileRoute } from "@tanstack/react-router";
import { AuctionCard } from "@/components/AuctionCard";
import { auctions } from "@/lib/mockData";

export const Route = createFileRoute("/dashboard/live")({ component: LivePage });

function LivePage() {
  const live = auctions.filter((a) => a.status === "LIVE");
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Live auctions<span className="font-light italic text-white/40"> · {live.length} active</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">Bid in real time. The AI auctioneer is calling each move.</p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {live.map((a) => <AuctionCard key={a.id} auction={a} />)}
      </div>
    </div>
  );
}
