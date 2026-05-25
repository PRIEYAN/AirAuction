import { Link } from "@tanstack/react-router";
import { Bot, ShieldCheck, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { truncateAddr } from "@/lib/format";
import { useAgent } from "@/hooks/useAgent";
import { explorerAddressUrl, isAgentRegistryConfigured } from "@/services/agentRegistry";

export function AgentBadge({ compact = false }: { compact?: boolean }) {
  const { identity, reputation, loading } = useAgent();

  if (!isAgentRegistryConfigured()) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
        <Bot className="h-3 w-3" /> Agent registry not configured
      </div>
    );
  }

  if (loading && !identity) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60">
        <Bot className="h-3 w-3" /> Loading agent identity...
      </div>
    );
  }

  if (!identity) {
    return null;
  }

  const scoreLabel = reputation
    ? `${reputation.score >= 0 ? "+" : ""}${reputation.score} / ${reputation.total}`
    : "—";

  if (compact) {
    return (
      <Link
        to="/agents"
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
      >
        <Bot className="h-3 w-3" />
        <span className="font-semibold">{identity.label}</span>
        <span className="text-white/40">#{identity.agentId}</span>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200">
          {scoreLabel}
        </span>
      </Link>
    );
  }

  return (
    <GlassCard className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400 text-black">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">{identity.label}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              ERC-8004 · Agent #{identity.agentId}
            </div>
          </div>
        </div>
        <Link to="/agents" className="text-xs text-white/50 hover:text-white">
          View benchmark →
        </Link>
      </div>
      <div className="text-xs text-white/60">{identity.description}</div>
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
          <ShieldCheck className="h-3 w-3" /> Reputation {scoreLabel}
        </span>
        <a
          href={explorerAddressUrl(identity.operator)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-white/70 hover:bg-white/5"
        >
          Operator {truncateAddr(identity.operator)} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </GlassCard>
  );
}
