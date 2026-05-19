import { BrowserProvider, Contract, JsonRpcProvider, formatEther, parseEther } from "ethers";
import { env, requireEnv } from "./env";
import { normalizeIpfsUrl } from "./nftApi";
import type { Auction, AuctionStatus, NFT } from "./mockData";

export const AUCTION_ESCROW_ABI = [
  "function createAuction(address nftContract,uint256 tokenId,uint256 reservePrice,uint256 startingBid,uint64 startTime,uint64 endTime,uint16 depositBps,string metadataURI) returns (uint256)",
  "function registerForAuction(uint256 auctionId) payable",
  "function placeBid(uint256 auctionId,uint256 bidAmount) payable",
  "function settle(uint256 auctionId)",
  "function withdrawRefund(uint256 auctionId)",
  "function auctions(uint256 auctionId) view returns (address seller,address nftContract,uint256 tokenId,uint256 reservePrice,uint256 startingBid,uint64 startTime,uint64 endTime,uint16 depositBps,address highestBidder,uint256 highestBid,bool settled,string metadataURI)",
  "function auctionCount() view returns (uint256)",
] as const;

export const ERC721_ABI = [
  "function approve(address to,uint256 tokenId)",
  "function setApprovalForAll(address operator,bool approved)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function isApprovedForAll(address owner,address operator) view returns (bool)",
  "function ownerOf(uint256 tokenId) view returns (address)",
] as const;

export function getEthereum() {
  const ethereum = window.ethereum;
  if (!ethereum) throw new Error("MetaMask is not available in this browser.");
  return ethereum;
}

export async function getBrowserProvider() {
  return new BrowserProvider(getEthereum());
}

export function getReadProvider() {
  if (window.ethereum) return new BrowserProvider(window.ethereum);
  return new JsonRpcProvider(requireEnv(env.publicRpcUrl, "VITE_PUBLIC_RPC_URL"));
}

export async function getSigner() {
  const provider = await getBrowserProvider();
  return provider.getSigner();
}

export async function getEscrowContract(withSigner = true) {
  const address = requireEnv(env.auctionEscrowAddress, "VITE_AUCTION_ESCROW_ADDRESS");
  const runner = withSigner ? await getSigner() : getReadProvider();
  return new Contract(address, AUCTION_ESCROW_ABI, runner);
}

export async function approveNftForEscrow(nftContract: string, tokenId: string) {
  const escrow = requireEnv(env.auctionEscrowAddress, "VITE_AUCTION_ESCROW_ADDRESS");
  const signer = await getSigner();
  const owner = await signer.getAddress();
  const nft = new Contract(nftContract, ERC721_ABI, signer);
  const [approved, approvedForAll] = await Promise.all([
    nft.getApproved(tokenId) as Promise<string>,
    nft.isApprovedForAll(owner, escrow) as Promise<boolean>,
  ]);

  if (approved.toLowerCase() === escrow.toLowerCase() || approvedForAll) {
    return undefined;
  }

  const tx = await nft.approve(escrow, tokenId);
  return tx.wait();
}

export async function createEscrowAuction(input: {
  nftContract: string;
  tokenId: string;
  reserveEth: string;
  startingBidEth: string;
  startTime: string;
  endTime: string;
  depositBps: number;
  metadataURI: string;
}) {
  const contract = await getEscrowContract(true);
  const tx = await contract.createAuction(
    input.nftContract,
    input.tokenId,
    parseEther(input.reserveEth),
    parseEther(input.startingBidEth),
    Math.floor(new Date(input.startTime).getTime() / 1000),
    Math.floor(new Date(input.endTime).getTime() / 1000),
    input.depositBps,
    input.metadataURI,
  );
  return tx.wait();
}

export async function registerForAuction(auctionId: string, depositEth: string) {
  const contract = await getEscrowContract(true);
  const tx = await contract.registerForAuction(auctionId, { value: parseEther(depositEth) });
  return tx.wait();
}

export async function placeOnchainBid(auctionId: string, amountEth: string) {
  const contract = await getEscrowContract(true);
  const amount = parseEther(amountEth);
  const tx = await contract.placeBid(auctionId, amount, { value: amount });
  return tx.wait();
}

export async function fetchOnchainAuctions(): Promise<Auction[]> {
  const contract = await getEscrowContract(false);
  const count = Number(await contract.auctionCount());
  const ids = Array.from({ length: count }, (_, index) => index + 1);
  const rows = await Promise.all(ids.map(async (id) => {
    const row = await contract.auctions(id);
    return mapAuctionRow(String(id), row);
  }));
  return rows.reverse();
}

export async function fetchOnchainAuction(id: string): Promise<Auction> {
  const contract = await getEscrowContract(false);
  const row = await contract.auctions(id);
  return mapAuctionRow(id, row);
}

async function mapAuctionRow(id: string, row: any): Promise<Auction> {
  const metadataURI = String(row.metadataURI ?? "");
  const metadata = await fetchAuctionMetadata(metadataURI);
  const nftFromMetadata = metadata.nft as Partial<NFT> | undefined;
  const now = Date.now();
  const startMs = Number(row.startTime) * 1000;
  const endMs = Number(row.endTime) * 1000;
  const status: AuctionStatus = now < startMs ? "SCHEDULED" : now <= endMs ? "LIVE" : "ENDED";
  const highestBid = Number(formatEther(row.highestBid));
  const startingBid = Number(formatEther(row.startingBid));

  return {
    id,
    seller: String(row.seller),
    currentBid: highestBid || startingBid,
    bidCount: 0,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    status,
    reservePrice: Number(formatEther(row.reservePrice)),
    bidHistory: [],
    nft: {
      id: nftFromMetadata?.id ?? `${row.nftContract}:${row.tokenId}`,
      name: nftFromMetadata?.name ?? `Token #${row.tokenId}`,
      image: nftFromMetadata?.image ?? "",
      collection: nftFromMetadata?.collection ?? "On-chain NFT",
      tokenId: String(row.tokenId),
      contractAddress: String(row.nftContract),
      chain: nftFromMetadata?.chain ?? "Ethereum",
      estimatedValueEth: Number(metadata.floorEth ?? 0),
      estimatedValueUsd: 0,
      traits: nftFromMetadata?.traits ?? [],
      priceHistory: [],
    },
  };
}

async function fetchAuctionMetadata(uri: string) {
  if (!uri) return {};
  const response = await fetch(normalizeIpfsUrl(uri));
  if (!response.ok) return {};
  return response.json() as Promise<Record<string, unknown>>;
}
