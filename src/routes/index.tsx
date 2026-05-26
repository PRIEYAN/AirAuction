import { memo, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AuctionCard } from "@/components/AuctionCard";
import { Button } from "@/components/ui/button";
import { useAuctions } from "@/hooks/useAuctions";
import { useCountdown } from "@/hooks/useCountdown";
import { DEFAULT_CHAIN } from "@/config/chains";
import type { Auction } from "@/types/auction";
import heroBg from "@/assets/herobg.jpeg";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { auctions, loading, error } = useAuctions();

  const { live, ended, featured, totalVolume, uniqueBidders } = useMemo(() => {
    const liveList = auctions.filter((a) => a.status === "LIVE");
    const endedList = auctions.filter((a) => a.status === "ENDED");
    const bidders = new Set<string>();
    let volume = 0;
    for (const a of auctions) {
      for (const b of a.bidHistory) bidders.add(b.bidder.toLowerCase());
    }
    for (const a of endedList) volume += a.currentBid;
    return {
      live: liveList,
      ended: endedList,
      featured: liveList[0],
      totalVolume: volume,
      uniqueBidders: bidders.size,
    };
  }, [auctions]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ============================ HERO ============================ */}
      <section className="relative min-h-[100svh] w-full overflow-hidden">
        <img
          src={heroBg}
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 hero-vignette" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-6 pt-28 pb-10 md:px-12 md:pt-32 md:pb-14">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              Now hosting auctions narrated by AI
            </div>

            <h1 className="mt-7 max-w-3xl text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-tight">
              Cinematic auctions for
              <br />
              <span className="font-light italic text-white/55">extraordinary NFTs.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/65">
              AuctionAir is an AI-hosted live auction floor. Watch your collection sell in real
              time, guided by a narrator that knows every trait, holder, and price beat.
            </p>
          </div>

          {/* Bottom row: stats left, featured live card right */}
          <div className="mt-10 flex flex-col items-end justify-between gap-8 md:flex-row md:items-end">
            <div className="grid w-full max-w-xl grid-cols-3 gap-3">
              <Stat label="Total Volume" value={`${totalVolume.toLocaleString()} ETH`} />
              <Stat label="NFTs Sold" value={ended.length.toLocaleString()} />
              <Stat label="Active Bidders" value={uniqueBidders.toLocaleString()} />
            </div>

            {featured ? (
              <FeaturedHeroCard featured={featured} />
            ) : loading ? (
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/60 p-6 text-sm text-white/60">
                Scanning {DEFAULT_CHAIN.name} for live auctions…
              </div>
            ) : (
              <EmptyHeroCard />
            )}
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section id="features" className="border-t border-white/5 px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">Features</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              An auction house built for
              <span className="font-light italic text-white/45"> verifiable AI.</span>
            </h2>
            <p className="mt-3 text-sm text-white/55">
              Identity, benchmark, reputation — three primitives chained so every word the agent
              says is observable, attributable, and contestable.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Feature
              title="ERC-8004 Identity"
              text="Each agent is minted as a non-marketplace identity NFT with its capabilities, model, and operator on chain."
            />
            <Feature
              title="On-chain Benchmark"
              text="Every Groq response is hashed and signed by the agent EOA, then written to AgentBenchmark on Mantle. Permanent, auditable."
            />
            <Feature
              title="Live Reputation"
              text="Bidders rate replies from their own wallet. AgentReputationRegistry tallies the verdicts — no platform middleman."
            />
          </div>
        </div>
      </section>

      {/* ============================ LIVE AUCTIONS ============================ */}
      <section id="live" className="border-t border-white/5 px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Live Auctions</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Live now
                <span className="font-light italic text-white/45"> on the floor.</span>
              </h2>
            </div>
            <Link to="/dashboard/live" className="text-sm text-white/60 hover:text-white">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
              Loading on-chain auctions…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 text-sm text-red-200">
              {error}
            </div>
          ) : live.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {live.slice(0, 6).map((a) => (
                <AuctionCard key={a.id} auction={a} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
              No live auctions yet. Connect a wallet and list one from the dashboard.
            </div>
          )}
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="border-t border-white/5 px-6 py-24 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Be in the room when
            <span className="font-light italic text-white/45"> the agents wake up.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
            Plug a Mantle wallet in, mint a test NFT, and watch your auction settle while an AI
            auctioneer narrates the close.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90">
                Enter Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/agents">
              <Button
                variant="ghost"
                className="h-11 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10"
              >
                Audit the AI
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer id="about" className="border-t border-white/5 px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-md border border-white/15 bg-white/10" />
            <span>© 2026 AuctionAir · An AI-hosted auction floor.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/agents" className="hover:text-white">Agents</Link>
            <a href={DEFAULT_CHAIN.explorerUrl} target="_blank" rel="noreferrer" className="hover:text-white">
              {DEFAULT_CHAIN.name} Explorer
            </a>
            <a href="https://faucet.sepolia.mantle.xyz" target="_blank" rel="noreferrer" className="hover:text-white">
              Faucet
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const Stat = memo(function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 transition-colors duration-150">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
});

const Feature = memo(function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.05]">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-white/60">{text}</div>
    </div>
  );
});

const FeaturedHeroCard = memo(function FeaturedHeroCard({ featured }: { featured: Auction }) {
  const { label } = useCountdown(featured.endTime);
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/90 transition-colors duration-150">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
        <img
          src={featured.nft.image}
          alt={featured.nft.name}
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Live
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          {featured.nft.chain}
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            {featured.nft.collection}
          </div>
          <div className="mt-0.5 text-base font-semibold text-white">{featured.nft.name}</div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Current Bid</div>
            <div className="text-2xl font-bold">{featured.currentBid} ETH</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Ends In</div>
            <div className="font-mono text-sm">{label}</div>
          </div>
        </div>
        <Link to="/auction/$id" params={{ id: featured.id }} className="block">
          <Button className="w-full rounded-full bg-white text-black hover:bg-white/90">
            Place a Bid
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
});

const EmptyHeroCard = memo(function EmptyHeroCard() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/90 p-6 text-center transition-colors duration-150">
      <div className="text-sm font-semibold">No live lots yet</div>
      <p className="mt-2 text-xs text-white/55">
        List the first NFT from the dashboard to seed the floor.
      </p>
      <Link to="/dashboard/raise" className="mt-4 inline-block">
        <Button className="rounded-full bg-white text-black hover:bg-white/90">
          Raise the first auction
        </Button>
      </Link>
    </div>
  );
});
