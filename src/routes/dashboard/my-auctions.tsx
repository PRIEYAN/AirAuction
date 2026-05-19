import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { myAuctions } from "@/lib/mockData";
import { AuctionCard } from "@/components/AuctionCard";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useCountdown } from "@/lib/useCountdown";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/my-auctions")({ component: MyAuctions });

function MyAuctions() {
  const [view, setView] = useState<"cards" | "table">("cards");
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            My auctions<span className="font-light italic text-white/40"> · {myAuctions.length}</span>
          </h1>
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-xs">
          {(["cards", "table"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 capitalize transition ${view === v ? "bg-white text-black" : "text-white/60"}`}>
              {v}
            </button>
          ))}
        </div>
      </header>

      {view === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myAuctions.map((a) => <AuctionCard key={a.id} auction={a} cta="View Auction" />)}
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3">NFT</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Current Bid</th>
                <th className="px-4 py-3">Bidders</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Earned</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {myAuctions.map((a) => <Row key={a.id} a={a} />)}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

function Row({ a }: { a: typeof myAuctions[number] }) {
  const { label } = useCountdown(a.status === "SCHEDULED" ? a.startTime : a.endTime);
  return (
    <tr className="hover:bg-white/5">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={a.nft.image} alt="" className="h-10 w-10 rounded-md object-cover" />
          <div>
            <div className="font-medium">{a.nft.name}</div>
            <div className="text-xs text-white/40">{a.nft.collection}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
      <td className="px-4 py-3 font-semibold">{a.currentBid} ETH</td>
      <td className="px-4 py-3 text-white/60">{a.bidCount}</td>
      <td className="px-4 py-3 font-mono text-xs text-white/60">{label}</td>
      <td className="px-4 py-3">{a.status === "ENDED" ? `${a.currentBid} ETH` : "—"}</td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant="ghost" className="text-white/70 hover:text-white">View</Button>
      </td>
    </tr>
  );
}
