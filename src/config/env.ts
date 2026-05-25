export const env = {
  reservoirApiKey: import.meta.env.VITE_RESERVOIR_API_KEY as string | undefined,
  reservoirBaseUrl: import.meta.env.VITE_RESERVOIR_BASE_URL as string | undefined,
  pinataJwt: import.meta.env.VITE_PINATA_JWT as string | undefined,
  auctionEscrowAddress: import.meta.env.VITE_AUCTION_ESCROW_ADDRESS as string | undefined,
  publicRpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL as string | undefined,
  nftContracts: (import.meta.env.VITE_NFT_CONTRACTS as string | undefined) ?? "",
  agentApiUrl:
    (import.meta.env.VITE_AGENT_API_URL as string | undefined) ?? "http://localhost:5050",
  agentIdentityAddress: import.meta.env.VITE_AGENT_IDENTITY_ADDRESS as string | undefined,
  agentReputationAddress: import.meta.env.VITE_AGENT_REPUTATION_ADDRESS as string | undefined,
  agentBenchmarkAddress: import.meta.env.VITE_AGENT_BENCHMARK_ADDRESS as string | undefined,
  agentId: import.meta.env.VITE_AGENT_ID as string | undefined,
};

export function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing ${name}. Add it to your .env file.`);
  return value;
}
