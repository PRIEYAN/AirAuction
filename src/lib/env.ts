export const env = {
  alchemyApiKey: import.meta.env.VITE_ALCHEMY_API_KEY as string | undefined,
  alchemyNetwork: (import.meta.env.VITE_ALCHEMY_NETWORK as string | undefined) ?? "eth-sepolia",
  reservoirApiKey: import.meta.env.VITE_RESERVOIR_API_KEY as string | undefined,
  reservoirBaseUrl:
    (import.meta.env.VITE_RESERVOIR_BASE_URL as string | undefined) ?? "https://api-sepolia.reservoir.tools",
  pinataJwt: import.meta.env.VITE_PINATA_JWT as string | undefined,
  auctionEscrowAddress: import.meta.env.VITE_AUCTION_ESCROW_ADDRESS as string | undefined,
  publicRpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL as string | undefined,
};

export function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing ${name}. Add it to your .env file.`);
  return value;
}
