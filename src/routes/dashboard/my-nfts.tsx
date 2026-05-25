import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NFTCard } from "@/components/NFTCard";
import { truncateAddr } from "@/lib/format";
import type { NFT } from "@/types/auction";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChainBadge } from "@/components/ChainBadge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/providers/WalletProvider";
import { fetchWalletNfts } from "@/services/nftApi";
import { Copy, Gavel, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/my-nfts")({ component: MyNFTs });

function MyNFTs() {
  const [open, setOpen] = useState<NFT | null>(null);
  const [items, setItems] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { connected, address, connect } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!connected || !address) return;
    setLoading(true);
    setError("");
    fetchWalletNfts(address)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load NFTs."))
      .finally(() => setLoading(false));
  }, [address, connected]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          My NFTs<span className="font-light italic text-white/40"> · {items.length} pieces</span>
        </h1>
      </header>
      {!connected ? (
        <Button onClick={connect} className="rounded-full bg-white text-black hover:bg-white/90">Connect MetaMask</Button>
      ) : loading ? (
        <div className="inline-flex items-center gap-2 text-sm text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Scanning configured NFT contracts on-chain...
        </div>
      ) : error ? (
        <div className="text-sm text-red-200">{error}</div>
      ) : items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((n) => <NFTCard key={n.id} nft={n} onClick={() => setOpen(n)} />)}
        </div>
      ) : (
        <div className="text-sm text-white/50">No NFTs were returned for this wallet on the configured chain.</div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-zinc-950/95 text-white backdrop-blur-xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{open.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-2">
                <img src={open.image} alt={open.name} className="aspect-square w-full rounded-2xl object-cover" />
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <ChainBadge chain={open.chain} />
                    <span className="text-xs text-white/50">{open.collection} · #{open.tokenId}</span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Estimated Value</div>
                    <div className="text-3xl font-bold">{open.estimatedValueEth} ETH</div>
                    <div className="text-sm text-white/40">${open.estimatedValueUsd.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">Contract</div>
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs">
                      {truncateAddr(open.contractAddress)}
                      <Copy className="ml-auto h-3 w-3 text-white/40" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">Traits</div>
                    <div className="grid grid-cols-2 gap-2">
                      {open.traits.map((t) => (
                        <div key={t.type} className="rounded-lg border border-white/10 bg-white/5 p-2">
                          <div className="text-[10px] uppercase tracking-wider text-white/40">{t.type}</div>
                          <div className="text-sm font-medium">{t.value}</div>
                          <div className="text-[10px] text-white/40">{t.rarity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {open.priceHistory.length > 0 && <div>
                    <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">Price history</div>
                    <div className="space-y-1.5">
                      {open.priceHistory.map((p) => (
                        <div key={p.date} className="flex items-center justify-between text-xs">
                          <span className="text-white/50">{p.date}</span>
                          <span className="inline-flex items-center gap-1 font-mono">
                            {p.price} ETH
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>}
                  <Button
                    onClick={() => navigate({ to: "/dashboard/raise" })}
                    className="w-full rounded-full bg-white text-black hover:bg-white/90"
                  >
                    <Gavel className="mr-2 h-4 w-4" /> Raise Auction
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
