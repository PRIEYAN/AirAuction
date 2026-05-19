import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { myBidHistory } from "@/lib/mockData";

export const Route = createFileRoute("/dashboard/bids")({ component: Bids });

const resultStyles = {
  WON: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  OUTBID: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  LOST: "bg-white/10 text-white/60 border-white/20",
} as const;

function Bids() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Bid history<span className="font-light italic text-white/40"> · {myBidHistory.length}</span>
        </h1>
      </header>
      <GlassCard className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-[10px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">NFT</th>
              <th className="px-4 py-3">My Bid</th>
              <th className="px-4 py-3">Final Price</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {myBidHistory.map((b) => (
              <tr key={b.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={b.nft.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                    <div>
                      <div className="font-medium">{b.nft.name}</div>
                      <div className="text-xs text-white/40">{b.nft.collection}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">{b.myBid} ETH</td>
                <td className="px-4 py-3 text-white/70">{b.finalPrice} ETH</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${resultStyles[b.result]}`}>
                    {b.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-white/50">{new Date(b.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
