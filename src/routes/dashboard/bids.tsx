import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { useWallet } from "@/providers/WalletProvider";
import { useMyBidHistory } from "@/hooks/useMyBidHistory";
import type { BidResult } from "@/types/auction";

export const Route = createFileRoute("/dashboard/bids")({ component: Bids });

const resultStyles: Record<BidResult, string> = {
  WON: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  LEADING: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  OUTBID: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  LOST: "bg-white/10 text-white/60 border-white/20",
};

function Bids() {
  const { address, connected } = useWallet();
  const { history, loading, error } = useMyBidHistory(connected ? address : undefined);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Bid history<span className="font-light italic text-white/40"> · {history.length}</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Sourced live from <code className="text-white/70">BidPlaced</code> events on the escrow contract.
        </p>
      </header>

      {!connected ? (
        <GlassCard className="p-6 text-sm text-white/60">
          Connect a wallet to see the bids it has placed.
        </GlassCard>
      ) : loading ? (
        <GlassCard className="p-6 text-sm text-white/60">Loading on-chain bid history...</GlassCard>
      ) : error ? (
        <GlassCard className="p-6 text-sm text-red-200">{error}</GlassCard>
      ) : history.length === 0 ? (
        <GlassCard className="p-6 text-sm text-white/60">
          No bids found for this address yet. Place one from the auction room and it will appear here.
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3">NFT</th>
                <th className="px-4 py-3">My Bid</th>
                <th className="px-4 py-3">Current / Final</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Last Bid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((b) => (
                <tr key={b.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.nft.image || "https://picsum.photos/seed/placeholder/80"}
                        alt=""
                        className="h-10 w-10 rounded-md object-cover"
                      />
                      <div>
                        <div className="font-medium">{b.nft.name}</div>
                        <div className="text-xs text-white/40">{b.nft.collection}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{b.myBid} MNT</td>
                  <td className="px-4 py-3 text-white/70">{b.finalPrice} MNT</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${resultStyles[b.result]}`}>
                      {b.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/50">
                    {new Date(b.date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
