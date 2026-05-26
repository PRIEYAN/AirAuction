import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, ExternalLink, Sparkles, Activity, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Navbar } from "@/components/Navbar";
import { truncateAddr } from "@/lib/format";
import { useAgent, useAgentDecisions } from "@/hooks/useAgent";
import {
  explorerAddressUrl,
  isAgentRegistryConfigured,
} from "@/services/agentRegistry";
import { env } from "@/config/env";
import { DEFAULT_CHAIN } from "@/config/chains";

export const Route = createFileRoute("/agents")({ component: AgentsPage });

function AgentsPage() {
  const { identity, reputation, loading: idLoading, error: idError } = useAgent();
  const { decisions, loading: decLoading, error: decError } = useAgentDecisions({
    global: false,
    limit: 30,
    pollMs: 10_000,
  });

  if (!isAgentRegistryConfigured()) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="text-3xl font-semibold tracking-tight">Agent registry not configured</h1>
          <p className="mt-3 text-sm text-white/60">
            Deploy the agent registries with{" "}
            <code className="rounded bg-white/5 px-1 py-0.5">npm run deploy:agents:mantle-sepolia</code>{" "}
            in <code className="rounded bg-white/5 px-1 py-0.5">blockchain/</code>, then set the
            printed <code className="rounded bg-white/5 px-1 py-0.5">VITE_AGENT_*</code> values in
            the root <code className="rounded bg-white/5 px-1 py-0.5">.env</code>.
          </p>
        </div>
      </main>
    );
  }

  const totalDecisions = decisions.length;
  const avgLatency = totalDecisions
    ? Math.round(decisions.reduce((sum, d) => sum + d.latencyMs, 0) / totalDecisions)
    : 0;
  const scoreLabel = reputation
    ? `${reputation.score >= 0 ? "+" : ""}${reputation.score} / ${reputation.total}`
    : "—";

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-12 md:px-12">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Sparkles className="h-3 w-3" /> AI Awakening · live benchmark
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Agents on{" "}
            <span className="font-light italic text-white/40">{DEFAULT_CHAIN.name}</span>
          </h1>
          <p className="max-w-2xl text-sm text-white/60">
            Every reply from the AuctionAir auctioneer is hashed, signed, and written to the
            AgentBenchmark contract — making the agent's performance a permanent, decentralised
            record. Identities are issued via the ERC-8004-aligned AgentIdentityRegistry.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <GlassCard className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  ERC-8004 Identity
                </div>
                <div className="text-lg font-semibold">
                  {idLoading ? "Loading..." : identity?.label ?? "—"}
                </div>
              </div>
            </div>
            <div className="text-xs text-white/60">{identity?.description ?? "—"}</div>
            {identity && (
              <a
                href={explorerAddressUrl(identity.operator)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white"
              >
                Operator {truncateAddr(identity.operator)} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {idError && <div className="text-xs text-red-200">{idError}</div>}
          </GlassCard>

          <GlassCard className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">Reputation</div>
                <div className="text-2xl font-semibold">{scoreLabel}</div>
              </div>
            </div>
            <div className="text-xs text-white/50">
              Permissionless feedback log. Each bidder can submit one signed verdict per decision tx.
            </div>
          </GlassCard>

          <GlassCard className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-200">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  Decisions logged
                </div>
                <div className="text-2xl font-semibold">{totalDecisions}</div>
              </div>
            </div>
            <div className="text-xs text-white/50">
              Avg latency {avgLatency} ms · live polled every 10s from{" "}
              <span className="font-mono">AgentBenchmark</span>.
            </div>
          </GlassCard>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Live decision feed</h2>
            <Link to="/dashboard/live" className="text-xs text-white/50 hover:text-white">
              Back to live auctions →
            </Link>
          </div>
          {decLoading && decisions.length === 0 ? (
            <GlassCard className="p-6 text-sm text-white/60">Loading decision feed...</GlassCard>
          ) : decError ? (
            <GlassCard className="p-6 text-sm text-red-200">{decError}</GlassCard>
          ) : decisions.length === 0 ? (
            <GlassCard className="p-6 text-sm text-white/60">
              No decisions yet. Open an auction room and ask the AI auctioneer something — every
              reply will be hashed and recorded here.
            </GlassCard>
          ) : (
            <GlassCard className="overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-left text-[10px] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Topic</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3">Input hash</th>
                    <th className="px-4 py-3">Output hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {decisions.map((d, i) => (
                    <tr key={`${d.inputHash}-${i}`} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white/70">
                        {new Date(d.timestamp * 1000).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-white">{d.topic}</td>
                      <td className="px-4 py-3 text-white/70">{d.model}</td>
                      <td className="px-4 py-3 text-white/70">{d.latencyMs} ms</td>
                      <td className="px-4 py-3 font-mono text-white/50">
                        {d.inputHash.slice(0, 14)}…
                      </td>
                      <td className="px-4 py-3 font-mono text-white/50">
                        {d.outputHash.slice(0, 14)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Contracts</h2>
          <GlassCard className="grid gap-3 p-5 text-xs md:grid-cols-3">
            <ContractLink label="Identity (ERC-8004)" address={env.agentIdentityAddress} />
            <ContractLink label="Reputation" address={env.agentReputationAddress} />
            <ContractLink label="Benchmark" address={env.agentBenchmarkAddress} />
          </GlassCard>
        </section>
      </div>
    </main>
  );
}

function ContractLink({ label, address }: { label: string; address?: string }) {
  if (!address) {
    return (
      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
        <div className="text-white/40">Not configured</div>
      </div>
    );
  }
  return (
    <a
      href={explorerAddressUrl(address)}
      target="_blank"
      rel="noreferrer"
      className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10"
    >
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="font-mono text-white/80">{truncateAddr(address)}</div>
      <div className="inline-flex items-center gap-1 text-[10px] text-white/50">
        View on explorer <ExternalLink className="h-3 w-3" />
      </div>
    </a>
  );
}
