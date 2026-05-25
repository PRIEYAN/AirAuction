import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Gavel,
  Image as ImageIcon,
  Radio,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ChainBadge } from "@/components/ChainBadge";
import { AuctionCard } from "@/components/AuctionCard";
import { Button } from "@/components/ui/button";
import { AuroraBackdrop } from "@/components/AuroraBackdrop";
import { Marquee } from "@/components/Marquee";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { TypingTagline } from "@/components/TypingTagline";
import { useAuctions } from "@/hooks/useAuctions";
import { useAgent } from "@/hooks/useAgent";
import { useCountdown } from "@/hooks/useCountdown";
import { DEFAULT_CHAIN } from "@/config/chains";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { auctions, loading, error } = useAuctions();
  const { identity, reputation } = useAgent();

  const live = auctions.filter((a) => a.status === "LIVE");
  const ended = auctions.filter((a) => a.status === "ENDED");
  const featured = live[0];

  const totalVolume = ended.reduce((sum, a) => sum + a.currentBid, 0);
  const uniqueBidders = new Set(
    auctions.flatMap((a) => a.bidHistory.map((b) => b.bidder.toLowerCase())),
  ).size;

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ============================ HERO ============================ */}
      <section className="relative min-h-[100svh] w-full overflow-hidden pt-28 md:pt-32">
        <AuroraBackdrop />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-16 md:grid-cols-12 md:px-12 md:pb-24">
          <div className="md:col-span-7">
            <div className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-fuchsia-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-300" />
              </span>
              AI Awakening · live on {DEFAULT_CHAIN.name} Sepolia
            </div>

            <h1 className="mt-7 animate-fade-up text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[0.95] tracking-tight delay-100">
              The auction floor for{" "}
              <span className="text-shimmer">autonomous agents.</span>
            </h1>

            <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-white/65 delay-200 md:text-lg">
              AuctionAir is{" "}
              <TypingTagline className="font-medium text-white" />
              <br className="hidden md:block" />
              Every decision the auctioneer makes is hashed, signed, and recorded on chain via the
              ERC-8004 agent registries — a permanent, public benchmark of AI performance.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up delay-300">
              <Link to="/dashboard">
                <Button className="group relative h-12 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_8px_40px_rgba(255,255,255,0.18)] transition hover:shadow-[0_8px_40px_rgba(196,181,253,0.4)]">
                  <Wallet className="mr-2 h-4 w-4 text-fuchsia-500" />
                  Enter the dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/agents">
                <Button
                  variant="ghost"
                  className="h-12 rounded-full border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  See the AI benchmark
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 animate-fade-up delay-400">
              <Stat label="Total Volume" value={totalVolume} suffix=" MNT" decimals={2} />
              <Stat label="NFTs Sold" value={ended.length} />
              <Stat label="Unique Bidders" value={uniqueBidders} />
            </div>
          </div>

          {/* Live featured card */}
          <div className="md:col-span-5">
            <div className="relative animate-fade-up delay-500">
              {featured ? (
                <FeaturedHeroCard featured={featured} />
              ) : loading ? (
                <GlassCard className="p-8 text-sm text-white/60">Scanning Mantle for live auctions...</GlassCard>
              ) : (
                <EmptyHeroCard />
              )}

              {/* AI agent floating badge */}
              {identity && (
                <div className="absolute -bottom-6 -left-6 hidden w-64 animate-fade-up rounded-2xl border border-white/10 bg-zinc-950/90 p-3 shadow-2xl backdrop-blur-xl delay-700 md:block">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400 opacity-70 animate-pulse-ring" />
                      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400 text-black">
                        <Bot className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-white/40">
                        ERC-8004 · Agent #{identity.agentId}
                      </div>
                      <div className="truncate text-sm font-semibold">{identity.label}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-white/40">Reputation</span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                      {reputation
                        ? `${reputation.score >= 0 ? "+" : ""}${reputation.score} / ${reputation.total}`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <ScrollHint />
      </section>

      {/* ============================ MARQUEE ============================ */}
      <section className="relative overflow-hidden border-y border-white/5 bg-black py-8">
        <Marquee speed="normal">
          <MarqueeItem icon={Zap} label="Mantle Sepolia" />
          <MarqueeItem icon={Bot} label="ERC-8004 Identity" />
          <MarqueeItem icon={ShieldCheck} label="On-chain Benchmark" />
          <MarqueeItem icon={Sparkles} label="AI Auctioneer" />
          <MarqueeItem icon={Gavel} label="Escrowed Settlement" />
          <MarqueeItem icon={Radio} label="Live Bid Theatre" />
          <MarqueeItem icon={ImageIcon} label="NFT Provenance" />
        </Marquee>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section id="features" className="relative overflow-hidden px-6 py-28 md:px-12">
        <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-50" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-3 w-3 text-fuchsia-300" /> The Turing-test floor
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              An auction house built for{" "}
              <span className="font-light italic text-white/40">verifiable AI.</span>
            </h2>
            <p className="mt-4 text-sm text-white/55 md:text-base">
              Three primitives — identity, benchmark, reputation — chained together so every word
              the agent says is observable, attributable, and contestable.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            <Feature
              icon={Bot}
              accent="from-fuchsia-500/30 via-fuchsia-500/10 to-transparent"
              title="ERC-8004 Identity"
              text="Each agent is minted as a non-marketplace identity NFT with its capabilities, model, and operator on chain."
            />
            <Feature
              icon={ShieldCheck}
              accent="from-emerald-500/30 via-emerald-500/10 to-transparent"
              title="On-chain Benchmark"
              text="Every Groq response is hashed and signed by the agent EOA, then written to AgentBenchmark on Mantle. Permanent, auditable."
            />
            <Feature
              icon={Radio}
              accent="from-cyan-500/30 via-cyan-500/10 to-transparent"
              title="Live Reputation"
              text="Bidders rate replies from their own wallet. AgentReputationRegistry tallies the verdicts — no platform middleman."
            />
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-28 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              How a lot moves<br />
              <span className="font-light italic text-white/40">from wallet to settlement.</span>
            </h2>
            <Link to="/dashboard/raise" className="text-sm text-white/60 hover:text-white">
              List an NFT →
            </Link>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-4">
            <Step n={1} title="Approve & list" icon={ImageIcon}>
              Pick an NFT, set a reserve, pin metadata to IPFS, transfer into escrow.
            </Step>
            <Step n={2} title="Bidders register" icon={Wallet}>
              Each bidder locks a refundable deposit. Identity is just the EOA — no signup required.
            </Step>
            <Step n={3} title="AI narrates" icon={Bot}>
              The auctioneer agent comments, answers, and reasons. Every reply is hashed on-chain.
            </Step>
            <Step n={4} title="Settle" icon={Gavel}>
              Reserve met → NFT to winner, MNT to seller (minus fee). Reserve missed → automatic refund.
            </Step>
          </div>
        </div>
      </section>

      {/* ============================ LIVE AUCTIONS ============================ */}
      <section id="live" className="relative overflow-hidden border-t border-white/5 px-6 py-28 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Live now<span className="font-light italic text-white/40"> on the floor.</span>
            </h2>
            <Link to="/dashboard/live" className="text-sm text-white/60 hover:text-white">
              View all →
            </Link>
          </div>
          {loading ? (
            <GlassCard className="p-6 text-sm text-white/60">Loading on-chain auctions...</GlassCard>
          ) : error ? (
            <GlassCard className="p-6 text-sm text-red-200">{error}</GlassCard>
          ) : live.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {live.slice(0, 6).map((a, i) => (
                <div
                  key={a.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <AuctionCard auction={a} />
                </div>
              ))}
            </div>
          ) : (
            <GlassCard className="p-6 text-sm text-white/60">
              No live auctions yet. Connect a wallet and list one from the dashboard.
            </GlassCard>
          )}
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-28 md:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-fuchsia-500/30 blur-3xl animate-aurora-shift" />
          <div className="absolute -bottom-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/30 blur-3xl animate-aurora-shift [animation-delay:-10s]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Be in the room when{" "}
            <span className="text-shimmer">the agents wake up.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm text-white/60 md:text-base">
            Plug a Mantle wallet in, mint a test NFT, and watch your auction settle while an AI
            auctioneer narrates the close.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button className="group h-12 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90">
                Enter Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/agents">
              <Button
                variant="ghost"
                className="h-12 rounded-full border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10"
              >
                Audit the AI
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer
        id="about"
        className="relative border-t border-white/5 px-6 py-10 md:px-12"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-md bg-gradient-to-br from-white via-fuchsia-200 to-cyan-200" />
            <span>© 2026 AuctionAir · A cinematic AI-hosted auction floor.</span>
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

function Stat({
  label,
  value,
  suffix,
  decimals = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-fuchsia-500/15 blur-2xl" />
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-bold">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
  accent,
}: {
  icon: any;
  title: string;
  text: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05]">
      <div
        className={`pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br ${accent} blur-3xl transition group-hover:opacity-100 opacity-60`}
      />
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative mt-5 text-lg font-semibold">{title}</div>
      <div className="relative mt-2 text-sm text-white/60">{text}</div>
    </div>
  );
}

function Step({
  n,
  title,
  icon: Icon,
  children,
}: {
  n: number;
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/25">
      <div className="absolute right-4 top-4 text-5xl font-bold text-white/[0.06]">{n}</div>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-400/20 to-cyan-400/20 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div className="relative mt-4 text-sm font-semibold">{title}</div>
      <div className="relative mt-1 text-xs text-white/55">{children}</div>
    </div>
  );
}

function MarqueeItem({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-white/60">
      <Icon className="h-4 w-4 text-fuchsia-300" />
      <span className="whitespace-nowrap">{label}</span>
      <span className="text-white/20">/</span>
    </span>
  );
}

function FeaturedHeroCard({
  featured,
}: {
  featured: ReturnType<typeof useAuctions>["auctions"][number];
}) {
  const { label } = useCountdown(featured.endTime);
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-fuchsia-500/30 via-violet-500/20 to-cyan-500/30 blur-2xl opacity-70 animate-gradient-pan" />
      <GlassCard className="relative overflow-hidden glow-ring">
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={featured.nft.image}
            alt={featured.nft.name}
            className="h-full w-full object-cover transition duration-[2200ms] hover:scale-[1.06]"
          />
          <div className="absolute inset-x-3 top-3 flex justify-between">
            <StatusBadge status={featured.status} />
            <ChainBadge chain={featured.nft.chain} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-4 bottom-4">
            <div className="text-[10px] uppercase tracking-wider text-white/70">
              {featured.nft.collection}
            </div>
            <div className="text-xl font-semibold">{featured.nft.name}</div>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Current Bid</div>
              <div className="text-3xl font-bold">{featured.currentBid} MNT</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/40">Ends In</div>
              <div className="font-mono text-sm">{label}</div>
            </div>
          </div>
          <Link to="/auction/$id" params={{ id: featured.id }}>
            <Button className="group w-full rounded-full bg-white text-black hover:bg-white/90">
              Enter the room
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

function EmptyHeroCard() {
  return (
    <GlassCard className="relative overflow-hidden p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <div className="mt-5 text-lg font-semibold">No live lots yet</div>
      <p className="mt-2 text-sm text-white/55">
        List the first NFT from the dashboard to seed the floor for the AI auctioneer.
      </p>
      <Link to="/dashboard/raise" className="mt-5 inline-block">
        <Button className="rounded-full bg-white text-black hover:bg-white/90">
          Raise the first auction
        </Button>
      </Link>
    </GlassCard>
  );
}

function ScrollHint() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
      <div className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.4em] text-white/40">
        <span>scroll</span>
        <span className="h-8 w-px overflow-hidden bg-white/10">
          <span className="block h-3 w-px translate-y-0 animate-[scan-line_2.6s_ease-in-out_infinite] bg-white" />
        </span>
      </div>
    </div>
  );
}
