import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { auctions, truncateAddr, type Bid } from "@/lib/mockData";
import { GlassCard } from "@/components/GlassCard";
import { ChainBadge } from "@/components/ChainBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatBubble } from "@/components/ChatBubble";
import { useCountdown } from "@/lib/useCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auction/$id")({ component: AuctionRoom });

const aiNarrationLines = [
  "We're at {bid} ETH — this piece has only 3 known holders globally. Who's countering?",
  "Going once at {bid} ETH. The trait pairing here is statistically a 0.4% combo.",
  "A late bid just crossed the wire. {bid} ETH and rising fast.",
  "Last sale of this collection cleared at 4.2 ETH. We're approaching that ceiling.",
  "Quiet on the floor — but two wallets just connected. Hold your bids.",
  "{bid} ETH. This bidder has won 8 auctions on AuctionAir in the last 30 days.",
  "Reserve has been met. Every bid from here is real value crossing hands.",
];

const aiReplies = [
  "Great question — provenance traces back to the original mint wallet, untouched.",
  "Rarity score for this piece sits in the top 2% of the collection.",
  "Holder count is currently 3,142, and concentration is healthy.",
  "Floor on Base is 0.6 ETH, but this token's traits push it well above that.",
];

function AuctionRoom() {
  const { id } = Route.useParams();
  const auction = auctions.find((a) => a.id === id) ?? auctions[0];
  const { label } = useCountdown(auction.endTime);

  const [bids, setBids] = useState<Bid[]>(auction.bidHistory);
  const [currentBid, setCurrentBid] = useState(auction.currentBid);
  const [chat, setChat] = useState<{ who: string; text: string; mine?: boolean }[]>([
    { who: "AI Auctioneer", text: `Welcome to the floor. ${auction.nft.name} is now open at ${auction.currentBid} ETH.` },
  ]);
  const [question, setQuestion] = useState("");
  const [bidOpen, setBidOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState((currentBid + 0.1).toFixed(2));
  const chatEnd = useRef<HTMLDivElement>(null);

  // Live AI narration every 4s
  useEffect(() => {
    const id = setInterval(() => {
      const line = aiNarrationLines[Math.floor(Math.random() * aiNarrationLines.length)];
      setChat((c) => [...c, { who: "AI Auctioneer", text: line.replace("{bid}", currentBid.toFixed(2)) }]);
    }, 4000);
    return () => clearInterval(id);
  }, [currentBid]);

  // Live bid feed every 6s
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentBid((cb) => {
        const next = +(cb + 0.05 + Math.random() * 0.4).toFixed(2);
        setBids((b) => [
          { bidder: "0x" + Math.random().toString(16).slice(2, 42).padEnd(40, "a"), amount: next, time: "just now" },
          ...b,
        ].slice(0, 30));
        return next;
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const askQuestion = () => {
    if (!question.trim()) return;
    setChat((c) => [...c, { who: "You", text: question, mine: true }]);
    const q = question;
    setQuestion("");
    setTimeout(() => {
      setChat((c) => [...c, { who: "AI Auctioneer", text: aiReplies[Math.floor(Math.random() * aiReplies.length)] }]);
    }, 1000);
    void q;
  };

  const placeBid = () => {
    const amt = parseFloat(bidAmount);
    if (!amt || amt <= currentBid) return;
    setCurrentBid(amt);
    setBids((b) => [{ bidder: "0xYOU000000000000000000000000000000000000", amount: amt, time: "just now" }, ...b]);
    setChat((c) => [...c, { who: "AI Auctioneer", text: `New bid at ${amt} ETH from the floor. Who's next?` }]);
    setBidOpen(false);
    setBidAmount((amt + 0.1).toFixed(2));
  };

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
            <Button onClick={placeBid} className="rounded-full bg-white text-black hover:bg-white/90">
              Confirm Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
