import { useCallback, useEffect, useState } from "react";
import { env } from "@/config/env";
import {
  fetchAgentIdentity,
  fetchAgentReputation,
  fetchGlobalDecisions,
  fetchRecentDecisions,
  isAgentRegistryConfigured,
  type AgentDecision,
  type AgentIdentity,
  type AgentReputation,
} from "@/services/agentRegistry";

export function useAgent(agentId: string | undefined = env.agentId) {
  const [identity, setIdentity] = useState<AgentIdentity | null>(null);
  const [reputation, setReputation] = useState<AgentReputation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    if (!agentId || !isAgentRegistryConfigured()) {
      setIdentity(null);
      setReputation(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([fetchAgentIdentity(agentId), fetchAgentReputation(agentId)])
      .then(([nextIdentity, nextReputation]) => {
        if (cancelled) return;
        setIdentity(nextIdentity);
        setReputation(nextReputation);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load agent identity.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { identity, reputation, loading, error, refresh };
}

export function useAgentDecisions(options: {
  agentId?: string;
  global?: boolean;
  limit?: number;
  pollMs?: number;
} = {}) {
  const { agentId = env.agentId, global = false, limit = 20, pollMs = 12_000 } = options;
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAgentRegistryConfigured()) {
      setDecisions([]);
      return;
    }
    if (!global && !agentId) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const rows = global
          ? await fetchGlobalDecisions(limit)
          : await fetchRecentDecisions(agentId!, limit);
        if (!cancelled) {
          setDecisions(rows);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load decisions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    if (pollMs > 0) {
      const id = setInterval(load, pollMs);
      return () => {
        cancelled = true;
        clearInterval(id);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [agentId, global, limit, pollMs]);

  return { decisions, loading, error };
}
