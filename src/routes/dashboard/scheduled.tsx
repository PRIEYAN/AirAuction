import { createFileRoute } from "@tanstack/react-router";
import { AuctionCard } from "@/components/AuctionCard";
import { auctions } from "@/lib/mockData";

export const Route = createFileRoute("/dashboard/scheduled")({ component: ScheduledPage });

function ScheduledPage() {
  const items = auctions.filter((a) => a.status === "SCHEDULED");
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Scheduled<span className="font-light italic text-white/40"> · upcoming drops</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">Register interest to be notified when these go live.</p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((a) => <AuctionCard key={a.id} auction={a} cta="Register Interest" />)}
      </div>
    </div>
  );
}
