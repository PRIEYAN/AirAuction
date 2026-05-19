import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ChainBadge } from "@/components/ChainBadge";
import { AuctionCard } from "@/components/AuctionCard";
import { Button } from "@/components/ui/button";
import { auctions, platformStats } from "@/lib/mockData";
import { useCountdown } from "@/lib/useCountdown";
import { ArrowRight, Sparkles, Bot, Radio, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const featured = auctions.find((a) => a.status === "LIVE")!;
  const { label } = useCountdown(featured.endTime);
  const live = auctions.filter((a) => a.status === "LIVE").slice(0, 6);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="relative h-[100svh] min-h-[760px] w-full overflow-hidden">
        <img
          src="https://picsum.photos/seed/auctionair-hero/1920/1200"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,80,255,0.25),transparent_60%)]" />
        <Navbar />

        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16 md:px-12 md:pb-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Now hosting auctions narrated by AI
            </div>
            <h1 className="text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[0.95] tracking-tight">
              Cinematic auctions for<br />
              <span className="font-light italic text-white/40">extraordinary NFTs.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/60">
              AuctionAir is an AI-hosted live auction floor. Watch your collection sell in real time,
              guided by a narrator that knows every trait, holder, and price beat.
            </p>
          </div>

          {/* Stats bottom-left */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Stat label="Total Volume" value={`${platformStats.totalVolumeEth.toLocaleString()} ETH`} />
            <Stat label="NFTs Sold" value={platformStats.nftsSold.toLocaleString()} />
            <Stat label="Active Bidders" value={platformStats.activeBidders.toLocaleString()} />
          </div>

          {/* Featured floating card bottom-right */}
          <GlassCard className="absolute bottom-16 right-6 hidden w-[360px] overflow-hidden md:block lg:right-12">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={featured.nft.image} alt={featured.nft.name} className="h-full w-full object-cover" />
              <div className="absolute inset-x-3 top-3 flex justify-between">
                <StatusBadge status={featured.status} />
                <ChainBadge chain={featured.nft.chain} />
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">{featured.nft.collection}</div>
                <div className="text-base font-semibold">{featured.nft.name}</div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Current Bid</div>
                  <div className="text-2xl font-bold">{featured.currentBid} ETH</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Ends In</div>
                  <div className="font-mono text-sm">{label}</div>
                </div>
              </div>
              <Link to="/auction/$id" params={{ id: featured.id }}>
                <Button className="w-full rounded-full bg-white text-black hover:bg-white/90">
                  Place a Bid <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-white/5 px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            A live floor.<br /><span className="font-light italic text-white/40">An AI auctioneer.</span>
          </h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <Feature icon={Bot} title="AI Auctioneer" text="Narrates every bid with provenance, rarity, and holder stats — live." />
            <Feature icon={Radio} title="Live Bid Rooms" text="Real-time bidding theatre with countdowns, feeds, and Q&A." />
            <Feature icon={ShieldCheck} title="Multi-Chain" text="Auction NFTs on Ethereum, Base, and Polygon with unified UX." />
          </div>
        </div>
      </section>

      {/* LIVE AUCTIONS */}
      <section id="live" className="border-t border-white/5 px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Live now<span className="font-light italic text-white/40"> on the floor.</span>
            </h2>
            <Link to="/dashboard/live" className="text-sm text-white/60 hover:text-white">View all →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((a) => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </div>
      </section>

      <footer id="about" className="border-t border-white/5 px-6 py-10 text-center text-xs text-white/40 md:px-12">
        © 2026 AuctionAir. A cinematic AI-hosted auction floor.
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </GlassCard>
  );
}

function Feature({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <GlassCard className="p-6">
      <Icon className="mb-4 h-6 w-6 text-white/70" />
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-white/55">{text}</div>
    </GlassCard>
  );
}
