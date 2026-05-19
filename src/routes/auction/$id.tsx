import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { truncateAddr, type Auction, type Bid } from "@/lib/mockData";
import { GlassCard } from "@/components/GlassCard";
import { ChainBadge } from "@/components/ChainBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatBubble } from "@/components/ChatBubble";
import { useCountdown } from "@/lib/useCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fetchOnchainAuction, placeOnchainBid, registerForAuction } from "@/lib/auctionContract";
import { askAuctioneer } from "@/lib/aiAuctioneer";
import { ArrowLeft, Loader2, Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auction/$id")({ component: AuctionRoom });

function AuctionRoom() {
  const { id } = Route.useParams();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { label } = useCountdown(auction?.endTime ?? new Date().toISOString());

  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [chat, setChat] = useState<{ who: string; text: string; mine?: boolean }[]>([
  ]);
  const [question, setQuestion] = useState("");
  const [bidOpen, setBidOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("0");
  const [depositAmount, setDepositAmount] = useState("0");
  const [busy, setBusy] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchOnchainAuction(id)
      .then((next) => {
        setAuction(next);
        setBids(next.bidHistory);
        setCurrentBid(next.currentBid);
        setBidAmount((next.currentBid + 0.01).toFixed(4));
        setDepositAmount((next.currentBid * 0.15).toFixed(4));
        setChat([{ who: "AI Auctioneer", text: `Welcome to the floor. ${next.nft.name} is open at ${next.currentBid} ETH.` }]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load auction."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const context = auction && {
    lotName: auction.nft.name,
    collection: auction.nft.collection,
    traits: auction.nft.traits,
    currentBidEth: currentBid,
    reserveEth: auction.reservePrice,
    bidderCount: auction.bidCount,
  };

  const askQuestion = async () => {
    if (!question.trim() || !context) return;
    setChat((c) => [...c, { who: "You", text: question, mine: true }]);
    const q = question;
    setQuestion("");
    try {
      const answer = await askAuctioneer(context, q);
      setChat((c) => [...c, { who: "AI Auctioneer", text: answer }]);
    } catch (err) {
      setChat((c) => [...c, { who: "System", text: err instanceof Error ? err.message : "AI response failed." }]);
    }
  };

  const placeBid = async () => {
    if (!auction || !context) return;
    const amt = parseFloat(bidAmount);
    if (!amt || amt <= currentBid) return;
    setBusy("Submitting bid transaction...");
    try {
      await placeOnchainBid(auction.id, bidAmount);
      setCurrentBid(amt);
      setBids((b) => [{ bidder: "Your wallet", amount: amt, time: "just now" }, ...b]);
      const narration = await askAuctioneer({ ...context, currentBidEth: amt }, `A new bid landed at ${amt} ETH. Narrate it.`);
      setChat((c) => [...c, { who: "AI Auctioneer", text: narration }]);
      setBidOpen(false);
      setBidAmount((amt + 0.01).toFixed(4));
    } catch (err) {
      setChat((c) => [...c, { who: "System", text: err instanceof Error ? err.message : "Bid failed." }]);
    } finally {
      setBusy("");
    }
  };

  const register = async () => {
    if (!auction) return;
    setBusy("Locking bidder deposit...");
    try {
      await registerForAuction(auction.id, depositAmount);
      setRegisterOpen(false);
      setChat((c) => [...c, { who: "System", text: "Deposit locked. You are registered for this auction." }]);
    } catch (err) {
      setChat((c) => [...c, { who: "System", text: err instanceof Error ? err.message : "Registration failed." }]);
    } finally {
      setBusy("");
    }
  };

  if (loading) return <div className="min-h-screen bg-black p-8 text-white">Loading auction...</div>;
  if (error || !auction) return <div className="min-h-screen bg-black p-8 text-red-200">{error || "Auction not found."}</div>;

  return (
    <div className="relative min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.18),transparent_60%)]" />
      <div className="relative">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 md:px-10">
          <Link to="/dashboard/live" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to live auctions
          </Link>
          <StatusBadge status={auction.status} />
        </div>

        <div className="grid gap-5 p-5 md:p-8 lg:grid-cols-12">
          {/* LEFT: NFT */}
          <div className="space-y-5 lg:col-span-4">
            <GlassCard className="overflow-hidden">
              <img src={auction.nft.image} alt={auction.nft.name} className="aspect-square w-full object-cover" />
              <div className="space-y-4 p-5">
                <div>
                  <div className="text-xs text-white/40">{auction.nft.collection}</div>
                  <h1 className="text-2xl font-semibold">{auction.nft.name}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ChainBadge chain={auction.nft.chain} />
                  <span className="text-xs text-white/40">#{auction.nft.tokenId}</span>
                </div>
                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">Traits</div>
                  <div className="grid grid-cols-2 gap-2">
                    {auction.nft.traits.map((t) => (
                      <div key={t.type} className="rounded-lg border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] uppercase tracking-wider text-white/40">{t.type}</div>
                        <div className="text-sm">{t.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">Contract</div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs">
                    {truncateAddr(auction.nft.contractAddress)}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* CENTER: AI chat */}
          <div className="lg:col-span-5">
            <GlassCard className="flex h-[calc(100svh-180px)] flex-col">
              <div className="flex items-center gap-2 border-b border-white/10 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400">
                  <Sparkles className="h-4 w-4 text-black" />
                </div>
                <div>
                  <div className="text-sm font-semibold">AI Auctioneer</div>
                  <div className="text-[10px] text-white/40">Live narration · Ask anything about this lot</div>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chat.map((m, i) => <ChatBubble key={i} who={m.who} text={m.text} mine={m.mine} />)}
                <div ref={chatEnd} />
              </div>
              <div className="flex gap-2 border-t border-white/10 p-3">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askQuestion()}
                  placeholder="Ask the auctioneer…"
                  className="border-white/10 bg-white/5"
                />
                <Button onClick={askQuestion} className="rounded-full bg-white text-black hover:bg-white/90">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* RIGHT: Bid feed */}
          <div className="lg:col-span-3">
            <GlassCard className="flex h-[calc(100svh-180px)] flex-col">
              <div className="border-b border-white/10 p-4">
                <div className="text-[10px] uppercase tracking-wider text-white/40">Current bid</div>
                <div className="text-3xl font-bold">{currentBid.toFixed(2)} ETH</div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-white/40">Ends in</span>
                  <span className="font-mono">{label}</span>
                </div>
                <Button onClick={() => setBidOpen(true)}
                  className="mt-3 w-full rounded-full bg-white text-black hover:bg-white/90">
                  Place Bid
                </Button>
                <Button onClick={() => setRegisterOpen(true)} variant="ghost" className="mt-2 w-full rounded-full">
                  Lock Deposit
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-white/40">Live feed</div>
                <ul className="space-y-1">
                  {bids.map((b, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs">
                      <span className="font-mono text-white/70">{truncateAddr(b.bidder)}</span>
                      <span className="text-right">
                        <div className="font-semibold text-white">{b.amount} ETH</div>
                        <div className="text-[10px] text-white/40">{b.time}</div>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      <Dialog open={bidOpen} onOpenChange={setBidOpen}>
        <DialogContent className="border-white/10 bg-zinc-950/95 text-white">
          <DialogHeader>
            <DialogTitle>Place your bid</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-xs text-white/50">Minimum next bid: {(currentBid + 0.01).toFixed(2)} ETH</div>
            <Input value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
              className="border-white/10 bg-white/5 text-lg" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBidOpen(false)}>Cancel</Button>
            <Button disabled={Boolean(busy)} onClick={placeBid} className="rounded-full bg-white text-black hover:bg-white/90">
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Confirm Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="border-white/10 bg-zinc-950/95 text-white">
          <DialogHeader>
            <DialogTitle>Lock bidder deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-xs text-white/50">Deposit is refundable if you lose and counts toward your bid in this escrow.</div>
            <Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
              className="border-white/10 bg-white/5 text-lg" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegisterOpen(false)}>Cancel</Button>
            <Button disabled={Boolean(busy)} onClick={register} className="rounded-full bg-white text-black hover:bg-white/90">
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Lock Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
