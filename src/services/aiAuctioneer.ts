import { env } from "@/config/env";

type AuctionContext = {
  lotName: string;
  collection: string;
  traits: Array<{ type: string; value: string; rarity?: string }>;
  currentBidEth: number;
  reserveEth: number;
  bidderCount: number;
  recentBids?: Array<{ bidder: string; amount: number; time: string }>;
};

export interface OnchainReceipt {
  txHash: string | null;
  explorerUrl: string | null;
  inputHash: string;
  outputHash: string;
  benchmarkAddress?: string;
  chainId?: number;
  error?: string | null;
}

export interface AuctioneerResponse {
  reply: string;
  model?: string;
  latencyMs?: number;
  agentId?: number | string | null;
  onchain?: OnchainReceipt;
}

export async function askAuctioneer(
  context: AuctionContext,
  userMessage: string,
  contextRef?: string,
): Promise<AuctioneerResponse> {
  const base = env.agentApiUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/auctioneer`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ context, userMessage, contextRef, topic: "narrate" }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI auctioneer backend failed (${response.status}): ${detail || response.statusText}`);
  }

  const payload = (await response.json()) as AuctioneerResponse;
  return {
    ...payload,
    reply: payload.reply?.trim() || "I need more on-chain context before answering that.",
  };
}
