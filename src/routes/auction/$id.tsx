import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { truncateAddr } from "@/lib/format";
import type { Auction, Bid } from "@/types/auction";
import { GlassCard } from "@/components/GlassCard";
import { ChainBadge } from "@/components/ChainBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatBubble } from "@/components/ChatBubble";
import { AgentBadge } from "@/components/AgentBadge";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fetchOnchainAuction, placeOnchainBid, registerForAuction, settleOnchainAuction } from "@/services/auctionContract";
import { askAuctioneer, type OnchainReceipt } from "@/services/aiAuctioneer";
import {
  isAgentRegistryConfigured,
  submitAgentFeedback,
  type Verdict,
} from "@/services/agentRegistry";
import { env } from "@/config/env";
import { ArrowLeft, ExternalLink, Loader2, Send, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

export const Route = createFileRoute("/auction/$id")({ component: AuctionRoom });

interface ChatEntry {
  who: string;
  text: string;
  mine?: boolean;
  receipt?: OnchainReceipt | null;
  feedback?: Verdict | "pending";
}

function AuctionRoom() {
  const { id } = Route.useParams();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { label } = useCountdown(auction?.endTime ?? new Date().toISOString());

  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [chat, setChat] = useState<ChatEntry[]>([]);
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
        setChat([
          {
            who: "AI Auctioneer",
            text: `Welcome to the floor. ${next.nft.name} is open at ${next.currentBid} MNT.`,
          },
        ]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load auction."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const context = auction && {
    lotName: auction.nft.name,
    collection: auction.nft.collection,
    traits: auction.nft.traits,
    currentBidEth: currentBid,
    reserveEth: auction.reservePrice,
    bidderCount: new Set(bids.map(b => b.bidder.toLowerCase())).size,
    recentBids: bids.slice(0, 5).map(b => ({ bidder: b.bidder, amount: b.amount, time: b.time })),
  };

  const appendAuctioneerReply = (text: string, receipt?: OnchainReceipt | null) => {
    setChat((c) => [...c, { who: "AI Auctioneer", text, receipt: receipt ?? null }]);
  };

  const askQuestion = async () => {
    if (!question.trim() || !context || !auction) return;
    setChat((c) => [...c, { who: "You", text: question, mine: true }]);
    const q = question;
    setQuestion("");
    try {
      const result = await askAuctioneer(context, q, auction.id);
      appendAuctioneerReply(result.reply, result.onchain);
    } catch (err) {
      setChat((c) => [
        ...c,
        { who: "System", text: err instanceof Error ? err.message : "AI response failed." },
      ]);
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
      const result = await askAuctioneer(
        { ...context, currentBidEth: amt },
        `A new bid landed at ${amt} MNT. Narrate it.`,
        auction.id,
      );
      appendAuctioneerReply(result.reply, result.onchain);
      setBidOpen(false);
      setBidAmount((amt + 0.01).toFixed(4));
    } catch (err) {
      setChat((c) => [
        ...c,
        { who: "System", text: err instanceof Error ? err.message : "Bid failed." },
      ]);
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
      setChat((c) => [
        ...c,
        { who: "System", text: "Deposit locked. You are registered for this auction." },
      ]);
    } catch (err) {
      setChat((c) => [
        ...c,
        { who: "System", text: err instanceof Error ? err.message : "Registration failed." },
      ]);
    } finally {
      setBusy("");
    }
  };

  const settleAuction = async () => {
    if (!auction) return;
    setBusy("Settling auction escrow on-chain...");
    try {
      await settleOnchainAuction(auction.id);
      setAuction((prev) => prev ? { ...prev, settled: true } : null);
      setChat((c) => [
        ...c,
        { who: "System", text: "Auction successfully settled! The contract has automatically distributed assets according to the auction rules." },
      ]);
    } catch (err) {
      setChat((c) => [
        ...c,
        { who: "System", text: err instanceof Error ? err.message : "Settlement failed." },
      ]);
    } finally {
      setBusy("");
    }
  };

  const rateReply = async (idx: number, verdict: Verdict) => {
    const entry = chat[idx];
    if (!entry || !entry.receipt?.txHash || !env.agentId) return;
    setChat((c) => c.map((row, i) => (i === idx ? { ...row, feedback: "pending" } : row)));
    try {
      await submitAgentFeedback({
        agentId: env.agentId!,
        verdict,
        decisionRef: entry.receipt.txHash,
        memo: verdict === "positive" ? "thumbs up" : verdict === "negative" ? "thumbs down" : "neutral",
      });
      setChat((c) => c.map((row, i) => (i === idx ? { ...row, feedback: verdict } : row)));
    } catch (err) {
      setChat((c) => {
        const next = [...c];
        next[idx] = { ...next[idx], feedback: undefined };
        next.push({
          who: "System",
          text: err instanceof Error ? err.message : "Failed to submit feedback.",
        });
        return next;
      });
    }
  };

  if (loading) return <div className="min-h-screen bg-black p-8 text-white">Loading auction...</div>;
  if (error || !auction) {
    return <div className="min-h-screen bg-black p-8 text-red-200">{error || "Auction not found."}</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4 md:px-10">
          <Link to="/dashboard/live" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to live auctions
          </Link>
          <div className="flex items-center gap-3">
            <AgentBadge compact />
            <StatusBadge status={auction.status} />
          </div>
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
            <AgentBadge />
          </div>

          {/* CENTER: AI chat */}
          <div className="lg:col-span-5">
            <GlassCard className="flex h-[calc(100svh-180px)] flex-col">
              <div className="flex items-center gap-2 border-b border-white/10 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">AI Auctioneer</div>
                  <div className="text-[10px] text-white/40">Live narration · every reply benchmarked on Mantle</div>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chat.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <ChatBubble who={m.who} text={m.text} mine={m.mine} />
                    {m.who === "AI Auctioneer" && <ReceiptRow entry={m} onRate={(verdict) => rateReply(i, verdict)} />}
                  </div>
                ))}
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
                <div className="text-3xl font-bold">{currentBid.toFixed(2)} MNT</div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-white/40">Ends in</span>
                  <span className="font-mono">{label}</span>
                </div>
                {auction.status === "ENDED" ? (
                  auction.settled ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs text-white/60">
                      Closed & Settled
                    </div>
                  ) : (
                    <Button 
                      onClick={settleAuction} 
                      disabled={Boolean(busy)}
                      className="mt-3 w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600">
                      {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Settle Auction
                    </Button>
                  )
                ) : (
                  <>
                    <Button onClick={() => setBidOpen(true)}
                      className="mt-3 w-full rounded-full bg-white text-black hover:bg-white/90">
                      Place Bid
                    </Button>
                    <Button onClick={() => setRegisterOpen(true)} variant="ghost" className="mt-2 w-full rounded-full">
                      Lock Deposit
                    </Button>
                  </>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-white/40">Live feed</div>
                <ul className="space-y-1">
                  {bids.map((b, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs">
                      <span className="font-mono text-white/70">{truncateAddr(b.bidder)}</span>
                      <span className="text-right">
                        <div className="font-semibold text-white">{b.amount} MNT</div>
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
            <div className="text-xs text-white/50">Minimum next bid: {(currentBid + 0.01).toFixed(2)} MNT</div>
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

function ReceiptRow({
  entry,
  onRate,
}: {
  entry: ChatEntry;
  onRate: (verdict: Verdict) => void;
}) {
  const receipt = entry.receipt;
  if (!receipt) return null;
  return (
    <div className="ml-2 flex flex-wrap items-center gap-2 text-[10px] text-white/50">
      {receipt.txHash ? (
        <a
          href={receipt.explorerUrl ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-200"
        >
          ✓ Recorded on Mantle <ExternalLink className="h-3 w-3" />
        </a>
      ) : receipt.error ? (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-200">
          On-chain log skipped: {receipt.error}
        </span>
      ) : null}

      {isAgentRegistryConfigured() && receipt.txHash && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onRate("positive")}
            disabled={entry.feedback === "pending" || entry.feedback === "positive"}
            className={`flex h-6 w-6 items-center justify-center rounded-full border ${
              entry.feedback === "positive"
                ? "border-emerald-400 bg-emerald-500/30 text-emerald-100"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            title="Reward this answer (writes to AgentReputationRegistry)"
          >
            <ThumbsUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => onRate("negative")}
            disabled={entry.feedback === "pending" || entry.feedback === "negative"}
            className={`flex h-6 w-6 items-center justify-center rounded-full border ${
              entry.feedback === "negative"
                ? "border-red-400 bg-red-500/30 text-red-100"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            title="Flag this answer"
          >
            <ThumbsDown className="h-3 w-3" />
          </button>
          {entry.feedback === "pending" && <Loader2 className="h-3 w-3 animate-spin text-white/40" />}
        </div>
      )}
    </div>
  );
}
