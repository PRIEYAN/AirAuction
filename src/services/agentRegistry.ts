import { Contract, type EventLog } from "ethers";
import { env } from "@/config/env";
import { DEFAULT_CHAIN } from "@/config/chains";
import { getReadProvider, getSigner } from "@/services/auctionContract";

export const AGENT_IDENTITY_ABI = [
  "function agentCount() view returns (uint256)",
  "function agentOf(uint256 agentId) view returns (address operator,string label,string domain,string description,string metadataURI,uint64 registeredAt)",
  "function operatorOf(uint256 agentId) view returns (address)",
  "event AgentRegistered(uint256 indexed agentId,address indexed operator,string label,string domain)",
] as const;

export const AGENT_REPUTATION_ABI = [
  "function submitFeedback(uint256 agentId,uint8 verdict,bytes32 dataHash,bytes32 decisionRef,string memo) returns (uint256)",
  "function reputationOf(uint256 agentId) view returns (int256 score,uint256 total)",
  "function feedbackCountFor(uint256 agentId) view returns (uint256)",
  "function feedbackForAgent(uint256 agentId,uint256 limit,uint256 offset) view returns (tuple(uint256 agentId,address client,uint8 verdict,bytes32 dataHash,bytes32 decisionRef,string memo,uint64 timestamp)[])",
  "event FeedbackSubmitted(uint256 indexed feedbackId,uint256 indexed agentId,address indexed client,uint8 verdict,bytes32 dataHash,bytes32 decisionRef)",
] as const;

export const AGENT_BENCHMARK_ABI = [
  "function decisionCount() view returns (uint256)",
  "function decisionCountFor(uint256 agentId) view returns (uint256)",
  "function decisions(uint256 decisionId) view returns (uint256 agentId,bytes32 inputHash,bytes32 outputHash,bytes32 contextRef,uint64 timestamp,uint32 latencyMs,string model,string topic)",
  "function recentDecisions(uint256 agentId,uint256 limit,uint256 offset) view returns (tuple(uint256 agentId,bytes32 inputHash,bytes32 outputHash,bytes32 contextRef,uint64 timestamp,uint32 latencyMs,string model,string topic)[])",
  "function recentGlobal(uint256 limit,uint256 offset) view returns (tuple(uint256 agentId,bytes32 inputHash,bytes32 outputHash,bytes32 contextRef,uint64 timestamp,uint32 latencyMs,string model,string topic)[])",
  "event DecisionLogged(uint256 indexed decisionId,uint256 indexed agentId,bytes32 indexed contextRef,bytes32 inputHash,bytes32 outputHash,string model,string topic,uint32 latencyMs)",
] as const;

export type Verdict = "negative" | "neutral" | "positive";

const VERDICT_TO_CODE: Record<Verdict, number> = {
  negative: 0,
  neutral: 1,
  positive: 2,
};

export interface AgentIdentity {
  agentId: string;
  operator: string;
  label: string;
  domain: string;
  description: string;
  metadataURI: string;
  registeredAt: number;
}

export interface AgentReputation {
  score: number;
  total: number;
}

export interface AgentDecision {
  decisionId?: string;
  agentId: string;
  inputHash: string;
  outputHash: string;
  contextRef: string;
  timestamp: number;
  latencyMs: number;
  model: string;
  topic: string;
}

export function isAgentRegistryConfigured(): boolean {
  return Boolean(env.agentIdentityAddress && env.agentReputationAddress && env.agentBenchmarkAddress && env.agentId);
}

export function explorerTxUrl(txHash: string): string {
  return `${DEFAULT_CHAIN.explorerUrl}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${DEFAULT_CHAIN.explorerUrl}/address/${address}`;
}

function readIdentity() {
  if (!env.agentIdentityAddress) throw new Error("VITE_AGENT_IDENTITY_ADDRESS is not set.");
  return new Contract(env.agentIdentityAddress, AGENT_IDENTITY_ABI, getReadProvider());
}

function readReputation() {
  if (!env.agentReputationAddress) throw new Error("VITE_AGENT_REPUTATION_ADDRESS is not set.");
  return new Contract(env.agentReputationAddress, AGENT_REPUTATION_ABI, getReadProvider());
}

function readBenchmark() {
  if (!env.agentBenchmarkAddress) throw new Error("VITE_AGENT_BENCHMARK_ADDRESS is not set.");
  return new Contract(env.agentBenchmarkAddress, AGENT_BENCHMARK_ABI, getReadProvider());
}

export async function fetchAgentIdentity(agentId: string): Promise<AgentIdentity> {
  const contract = readIdentity();
  const row = await contract.agentOf(agentId);
  return {
    agentId,
    operator: String(row.operator ?? row[0]),
    label: String(row.label ?? row[1]),
    domain: String(row.domain ?? row[2]),
    description: String(row.description ?? row[3]),
    metadataURI: String(row.metadataURI ?? row[4]),
    registeredAt: Number(row.registeredAt ?? row[5]),
  };
}

export async function fetchAgentReputation(agentId: string): Promise<AgentReputation> {
  const contract = readReputation();
  const row = await contract.reputationOf(agentId);
  return {
    score: Number(row.score ?? row[0]),
    total: Number(row.total ?? row[1]),
  };
}

export async function fetchRecentDecisions(
  agentId: string,
  limit: number,
  offset = 0,
): Promise<AgentDecision[]> {
  const contract = readBenchmark();
  const rows = await contract.recentDecisions(agentId, limit, offset);
  return rows.map(mapDecision);
}

export async function fetchGlobalDecisions(limit: number, offset = 0): Promise<AgentDecision[]> {
  const contract = readBenchmark();
  const rows = await contract.recentGlobal(limit, offset);
  return rows.map(mapDecision);
}

export async function submitAgentFeedback(input: {
  agentId: string;
  verdict: Verdict;
  decisionRef?: string;
  memo?: string;
  dataHash?: string;
}) {
  if (!env.agentReputationAddress) throw new Error("VITE_AGENT_REPUTATION_ADDRESS is not set.");
  const signer = await getSigner();
  const contract = new Contract(env.agentReputationAddress, AGENT_REPUTATION_ABI, signer);

  const dataHash = input.dataHash ?? "0x" + "00".repeat(32);
  const decisionRef = input.decisionRef ?? "0x" + "00".repeat(32);
  const verdictCode = VERDICT_TO_CODE[input.verdict];

  const tx = await contract.submitFeedback(
    input.agentId,
    verdictCode,
    dataHash,
    decisionRef,
    input.memo ?? "",
  );
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
}

function mapDecision(row: any): AgentDecision {
  return {
    agentId: String(row.agentId ?? row[0]),
    inputHash: String(row.inputHash ?? row[1]),
    outputHash: String(row.outputHash ?? row[2]),
    contextRef: String(row.contextRef ?? row[3]),
    timestamp: Number(row.timestamp ?? row[4]),
    latencyMs: Number(row.latencyMs ?? row[5]),
    model: String(row.model ?? row[6]),
    topic: String(row.topic ?? row[7]),
  };
}

export async function fetchRecentDecisionEvents(limit = 25): Promise<EventLog[]> {
  const contract = readBenchmark();
  let events: EventLog[] = [];
  try {
    events = (await contract.queryFilter(contract.filters.DecisionLogged(), 0, "latest")) as EventLog[];
  } catch (err) {
    const provider = contract.runner?.provider;
    if (provider) {
      const latestBlock = await provider.getBlockNumber().catch(() => 0);
      events = (await contract.queryFilter(
        contract.filters.DecisionLogged(),
        Math.max(0, latestBlock - 9999),
        "latest",
      )) as EventLog[];
    }
  }
  return events.slice(-limit).reverse();
}
