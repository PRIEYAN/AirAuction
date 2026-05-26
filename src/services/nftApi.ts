import { Contract } from "ethers";
import { env } from "@/config/env";
import { DEFAULT_CHAIN } from "@/config/chains";
import { normalizeIpfsUrl } from "@/lib/uri";
import { getReadProvider } from "@/services/auctionContract";
import type { Chain, NFT, Trait } from "@/types/auction";

const ERC721_METADATA_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
] as const;

interface RawMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  attributes?: Array<{ trait_type?: string; type?: string; value?: unknown }>;
}

function getConfiguredContracts(): string[] {
  return env.nftContracts
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => /^0x[a-fA-F0-9]{40}$/.test(entry));
}

async function fetchTokenMetadata(uri: string): Promise<RawMetadata> {
  if (!uri) return {};
  try {
    if (uri.startsWith("data:application/json")) {
      const [, payload] = uri.split(",", 2);
      const decoded = uri.includes(";base64,") ? atob(payload) : decodeURIComponent(payload);
      return JSON.parse(decoded) as RawMetadata;
    }
    const response = await fetch(normalizeIpfsUrl(uri));
    if (!response.ok) return {};
    return (await response.json()) as RawMetadata;
  } catch {
    return {};
  }
}

function mapTraits(attributes: RawMetadata["attributes"]): Trait[] {
  return (attributes ?? [])
    .map((attr) => ({
      type: String(attr.trait_type ?? attr.type ?? "Trait"),
      value: String(attr.value ?? ""),
    }))
    .filter((trait) => trait.value);
}

async function scanContract(contractAddress: string, owner: string): Promise<NFT[]> {
  const provider = getReadProvider();
  const contract = new Contract(contractAddress, ERC721_METADATA_ABI, provider);

  const collection = (await contract.name().catch(() => "Unknown collection")) as string;
  let transfersIn: any[] = [];
  try {
    transfersIn = await contract.queryFilter(contract.filters.Transfer(null, owner), 0, "latest");
  } catch (err) {
    const latestBlock = await provider.getBlockNumber().catch(() => 0);
    transfersIn = await contract.queryFilter(
      contract.filters.Transfer(null, owner),
      Math.max(0, latestBlock - 9999),
      "latest",
    ).catch(() => []);
  }

  const candidateIds = Array.from(
    new Set(transfersIn.map((event: any) => String(event.args?.tokenId ?? event.args?.[2]))),
  );

  const ownedTokens = await Promise.all(
    candidateIds.map(async (tokenId) => {
      try {
        const currentOwner: string = await contract.ownerOf(tokenId);
        if (currentOwner.toLowerCase() !== owner.toLowerCase()) return null;
        const uri: string = await contract.tokenURI(tokenId);
        const metadata = await fetchTokenMetadata(uri);
        return { tokenId, uri, metadata };
      } catch {
        return null;
      }
    }),
  );

  return ownedTokens
    .filter((entry): entry is { tokenId: string; uri: string; metadata: RawMetadata } => entry !== null)
    .map(({ tokenId, metadata }) => ({
      id: `${contractAddress}:${tokenId}`,
      name: metadata.name ?? `${collection} #${tokenId}`,
      image: normalizeIpfsUrl(metadata.image ?? metadata.image_url ?? ""),
      collection,
      tokenId,
      contractAddress,
      chain: DEFAULT_CHAIN.name as Chain,
      estimatedValueEth: 0,
      estimatedValueUsd: 0,
      traits: mapTraits(metadata.attributes),
      priceHistory: [],
    }));
}

export async function fetchWalletNfts(owner: string): Promise<NFT[]> {
  const contracts = getConfiguredContracts();
  if (contracts.length === 0) return [];

  const results = await Promise.all(
    contracts.map((address) => scanContract(address, owner).catch(() => [] as NFT[])),
  );
  return results.flat();
}

export async function fetchCollectionFloorEth(contractAddress: string): Promise<number | null> {
  if (!env.reservoirBaseUrl) return null;
  try {
    const url = new URL("/collections/v7", env.reservoirBaseUrl);
    url.searchParams.set("id", contractAddress);
    const headers = env.reservoirApiKey ? { "x-api-key": env.reservoirApiKey } : undefined;
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      collections?: Array<{ floorAsk?: { price?: { amount?: { decimal?: number } } } }>;
    };
    return payload.collections?.[0]?.floorAsk?.price?.amount?.decimal ?? null;
  } catch {
    return null;
  }
}
