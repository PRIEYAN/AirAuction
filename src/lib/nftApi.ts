import { env, requireEnv } from "./env";
import type { Chain, NFT, Trait } from "./mockData";

type AlchemyOwnedNft = {
  contract?: { address?: string; name?: string; openSeaMetadata?: { collectionName?: string } };
  tokenId?: string;
  name?: string;
  title?: string;
  image?: { cachedUrl?: string; originalUrl?: string; pngUrl?: string };
  raw?: { metadata?: { image?: string; name?: string; attributes?: Array<Record<string, unknown>> } };
};

export function normalizeIpfsUrl(uri?: string) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
  return uri;
}

export async function fetchWalletNfts(owner: string): Promise<NFT[]> {
  const apiKey = requireEnv(env.alchemyApiKey, "VITE_ALCHEMY_API_KEY");
  const url = new URL(`https://${env.alchemyNetwork}.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`);
  url.searchParams.set("owner", owner);
  url.searchParams.set("withMetadata", "true");
  url.searchParams.set("pageSize", "100");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Alchemy NFT fetch failed: ${response.status}`);
  const payload = await response.json() as { ownedNfts?: AlchemyOwnedNft[] };

  return (payload.ownedNfts ?? [])
    .filter((item) => item.contract?.address && item.tokenId)
    .map((item) => {
      const metadata = item.raw?.metadata;
      const traits = (metadata?.attributes ?? []).map<Trait>((attr) => ({
        type: String(attr.trait_type ?? attr.type ?? "Trait"),
        value: String(attr.value ?? ""),
      })).filter((trait) => trait.value);
      const image = normalizeIpfsUrl(item.image?.cachedUrl ?? item.image?.pngUrl ?? item.image?.originalUrl ?? metadata?.image);
      const collection =
        item.contract?.openSeaMetadata?.collectionName ?? item.contract?.name ?? "Unverified collection";

      return {
        id: `${item.contract!.address}:${item.tokenId}`,
        name: item.name ?? item.title ?? metadata?.name ?? `Token #${item.tokenId}`,
        image,
        collection,
        tokenId: item.tokenId!,
        contractAddress: item.contract!.address!,
        chain: chainFromAlchemyNetwork(env.alchemyNetwork),
        estimatedValueEth: 0,
        estimatedValueUsd: 0,
        traits,
        priceHistory: [],
      };
    });
}

export async function fetchCollectionFloorEth(contractAddress: string) {
  const url = new URL("/collections/v7", env.reservoirBaseUrl);
  url.searchParams.set("id", contractAddress);
  const headers = env.reservoirApiKey ? { "x-api-key": env.reservoirApiKey } : undefined;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Reservoir floor fetch failed: ${response.status}`);
  const payload = await response.json() as { collections?: Array<{ floorAsk?: { price?: { amount?: { decimal?: number } } } }> };
  return payload.collections?.[0]?.floorAsk?.price?.amount?.decimal ?? null;
}

function chainFromAlchemyNetwork(network: string): Chain {
  if (network.includes("polygon")) return "Polygon";
  if (network.includes("base")) return "Base";
  return "Ethereum";
}
