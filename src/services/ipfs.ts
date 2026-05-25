import { env, requireEnv } from "@/config/env";

export async function pinAuctionLogToIpfs(payload: Record<string, unknown>) {
  const jwt = requireEnv(env.pinataJwt, "VITE_PINATA_JWT");
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: {
        name: `auctionair-${Date.now()}`,
      },
      pinataContent: payload,
    }),
  });

  if (!response.ok) throw new Error(`IPFS pin failed: ${response.status}`);
  const result = await response.json() as { IpfsHash: string };
  return `ipfs://${result.IpfsHash}`;
}
