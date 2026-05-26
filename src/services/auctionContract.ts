import { BrowserProvider, Contract, JsonRpcProvider, formatEther, parseEther, type EventLog } from "ethers";
import { env, requireEnv } from "@/config/env";
import { DEFAULT_CHAIN } from "@/config/chains";
import { normalizeIpfsUrl } from "@/lib/uri";
import type { Auction, AuctionStatus, Bid, BidHistoryEntry, Chain, NFT } from "@/types/auction";

export const AUCTION_ESCROW_ABI = [
  "function createAuction(address nftContract,uint256 tokenId,uint256 reservePrice,uint256 startingBid,uint64 startTime,uint64 endTime,uint16 depositBps,string metadataURI) returns (uint256)",
  "function registerForAuction(uint256 auctionId) payable",
  "function placeBid(uint256 auctionId,uint256 bidAmount) payable",
  "function settle(uint256 auctionId)",
  "function withdrawRefund(uint256 auctionId)",
  "function auctions(uint256 auctionId) view returns (address seller,address nftContract,uint256 tokenId,uint256 reservePrice,uint256 startingBid,uint64 startTime,uint64 endTime,uint16 depositBps,address highestBidder,uint256 highestBid,bool settled,string metadataURI)",
  "function auctionCount() view returns (uint256)",
  "event AuctionCreated(uint256 indexed auctionId,address indexed seller,address indexed nftContract,uint256 tokenId,uint256 reservePrice,uint256 startingBid,uint64 startTime,uint64 endTime,string metadataURI)",
  "event BidPlaced(uint256 indexed auctionId,address indexed bidder,uint256 amount)",
  "event AuctionSettled(uint256 indexed auctionId,address winner,uint256 amount,bool reserveMet)",
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
  const rpcUrl = env.publicRpcUrl ?? DEFAULT_CHAIN.rpcUrl;
  return new JsonRpcProvider(rpcUrl);
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

const ESCROW_ERROR_MAP: Record<string, string> = {
  "ended": "This auction has already ended.",
  "not owner": "You are not the contract owner.",
  "not token owner": "You do not own this NFT token.",
  "missing auction": "This auction lot does not exist.",
  "seller blocked": "The seller cannot bid or register for their own auction.",
  "registered": "You have already registered for this auction.",
  "deposit too low": "The locked deposit amount is below the required minimum deposit.",
  "not started": "This auction has not started yet.",
  "not registered": "You must lock a bidder deposit to register before placing a bid.",
  "bid too low": "Your bid is too low. It must be higher than the current bid.",
  "payment too low": "The transaction payment amount is insufficient.",
  "not ended": "This auction cannot be settled because it has not ended yet.",
  "settled": "This auction has already been settled.",
  "no refund": "You have no refundable deposit remaining for this auction.",
  "not seller": "Only the seller can cancel this auction.",
  "started": "This auction has already started and cannot be cancelled.",
};

export function parseEscrowError(err: any): Error {
  let message = "Transaction failed.";
  let reason = err?.reason || "";

  if (!reason && err?.message) {
    const match = err.message.match(/execution reverted:\s*["']([^"']+)["']/i) || 
                  err.message.match(/reason=["']([^"']+)["']/i);
    if (match && match[1]) {
      reason = match[1];
    }
  }

  if (reason && ESCROW_ERROR_MAP[reason.toLowerCase()]) {
    message = ESCROW_ERROR_MAP[reason.toLowerCase()];
  } else {
    const msgLower = (err?.message || "").toLowerCase();
    for (const [key, val] of Object.entries(ESCROW_ERROR_MAP)) {
      if (msgLower.includes(`reverted with reason string '${key}'`) || 
          msgLower.includes(`reverted: "${key}"`) || 
          msgLower.includes(`"${key}"`) ||
          msgLower.includes(`reason="${key}"`)) {
        message = val;
        break;
      }
    }
  }

  if (message === "Transaction failed.") {
    if (err?.message?.includes("user rejected action") || err?.message?.includes("ACTION_REJECTED")) {
      message = "Transaction rejected by user.";
    } else if (err?.message?.includes("insufficient funds")) {
      message = "Insufficient native token balance to cover gas and payment.";
    } else {
      message = err?.reason || err?.message || "Transaction failed.";
    }
  }

  return new Error(message);
}

export async function approveNftForEscrow(nftContract: string, tokenId: string) {
  try {
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
    return await tx.wait();
  } catch (err) {
    throw parseEscrowError(err);
  }
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
  try {
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
    return await tx.wait();
  } catch (err) {
    throw parseEscrowError(err);
  }
}

export async function registerForAuction(auctionId: string, depositEth: string) {
  try {
    const contract = await getEscrowContract(true);
    const tx = await contract.registerForAuction(auctionId, { value: parseEther(depositEth) });
    return await tx.wait();
  } catch (err) {
    throw parseEscrowError(err);
  }
}

export async function placeOnchainBid(auctionId: string, amountEth: string) {
  try {
    const contract = await getEscrowContract(true);
    const amount = parseEther(amountEth);
    const tx = await contract.placeBid(auctionId, amount, { value: amount });
    return await tx.wait();
  } catch (err) {
    throw parseEscrowError(err);
  }
}

export async function settleOnchainAuction(auctionId: string) {
  try {
    const contract = await getEscrowContract(true);
    const tx = await contract.settle(auctionId);
    return await tx.wait();
  } catch (err) {
    throw parseEscrowError(err);
  }
}

interface BidLogEntry {
  auctionId: string;
  bidder: string;
  amount: number;
  blockNumber: number;
  txHash: string;
}

interface SettlementLogEntry {
  auctionId: string;
  winner: string;
  amount: number;
  reserveMet: boolean;
}

async function loadAuctionEvents(contract: Contract): Promise<{
  bidsByAuction: Map<string, BidLogEntry[]>;
  settlements: Map<string, SettlementLogEntry>;
  blockTimes: Map<number, number>;
}> {
  const provider = contract.runner?.provider;
  let bidLogs: any[] = [];
  let settleLogs: any[] = [];

  try {
    [bidLogs, settleLogs] = await Promise.all([
      contract.queryFilter(contract.filters.BidPlaced(), 0, "latest"),
      contract.queryFilter(contract.filters.AuctionSettled(), 0, "latest"),
    ]);
  } catch (err) {
    if (provider) {
      const latestBlock = await provider.getBlockNumber().catch(() => 0);
      const startBlock = Math.max(0, latestBlock - 9999);
      [bidLogs, settleLogs] = await Promise.all([
        contract.queryFilter(contract.filters.BidPlaced(), startBlock, "latest").catch(() => []),
        contract.queryFilter(contract.filters.AuctionSettled(), startBlock, "latest").catch(() => []),
      ]);
    }
  }

  const bidsByAuction = new Map<string, BidLogEntry[]>();
  const blockNumbers = new Set<number>();

  for (const raw of bidLogs as EventLog[]) {
    const args = raw.args;
    if (!args) continue;
    const entry: BidLogEntry = {
      auctionId: String(args.auctionId ?? args[0]),
      bidder: String(args.bidder ?? args[1]),
      amount: Number(formatEther(args.amount ?? args[2])),
      blockNumber: raw.blockNumber,
      txHash: raw.transactionHash,
    };
    blockNumbers.add(raw.blockNumber);
    const list = bidsByAuction.get(entry.auctionId) ?? [];
    list.push(entry);
    bidsByAuction.set(entry.auctionId, list);
  }

  const settlements = new Map<string, SettlementLogEntry>();
  for (const raw of settleLogs as EventLog[]) {
    const args = raw.args;
    if (!args) continue;
    const entry: SettlementLogEntry = {
      auctionId: String(args.auctionId ?? args[0]),
      winner: String(args.winner ?? args[1]),
      amount: Number(formatEther(args.amount ?? args[2])),
      reserveMet: Boolean(args.reserveMet ?? args[3]),
    };
    settlements.set(entry.auctionId, entry);
  }

  const blockTimes = new Map<number, number>();
  if (provider) {
    await Promise.all(
      Array.from(blockNumbers).map(async (block) => {
        const info = await provider.getBlock(block);
        if (info?.timestamp) blockTimes.set(block, Number(info.timestamp) * 1000);
      }),
    );
  }

  for (const list of bidsByAuction.values()) {
    list.sort((a, b) => a.blockNumber - b.blockNumber);
  }

  return { bidsByAuction, settlements, blockTimes };
}

function buildBidHistory(entries: BidLogEntry[], blockTimes: Map<number, number>): Bid[] {
  return entries
    .slice()
    .reverse()
    .map((entry) => ({
      bidder: entry.bidder,
      amount: entry.amount,
      time: blockTimes.has(entry.blockNumber)
        ? new Date(blockTimes.get(entry.blockNumber)!).toISOString()
        : `block ${entry.blockNumber}`,
    }));
}

export async function fetchOnchainAuctions(): Promise<Auction[]> {
  const contract = await getEscrowContract(false);
  const count = Number(await contract.auctionCount());
  if (count === 0) return [];

  const events = await loadAuctionEvents(contract);
  const ids = Array.from({ length: count }, (_, index) => index + 1);
  const rows = await Promise.all(
    ids.map(async (id) => {
      const row = await contract.auctions(id);
      const idStr = String(id);
      return mapAuctionRow(idStr, row, events.bidsByAuction.get(idStr) ?? [], events.blockTimes);
    }),
  );
  return rows.reverse();
}

export async function fetchOnchainAuction(id: string): Promise<Auction> {
  const contract = await getEscrowContract(false);
  const row = await contract.auctions(id);
  const provider = contract.runner?.provider;
  let bidLogs: any[] = [];
  try {
    bidLogs = await contract.queryFilter(contract.filters.BidPlaced(id), 0, "latest");
  } catch (err) {
    if (provider) {
      const latestBlock = await provider.getBlockNumber().catch(() => 0);
      bidLogs = await contract.queryFilter(
        contract.filters.BidPlaced(id),
        Math.max(0, latestBlock - 9999),
        "latest",
      ).catch(() => []);
    }
  }
  const bids: BidLogEntry[] = [];
  const blockTimes = new Map<number, number>();
  for (const raw of bidLogs as EventLog[]) {
    const args = raw.args;
    if (!args) continue;
    bids.push({
      auctionId: id,
      bidder: String(args.bidder ?? args[1]),
      amount: Number(formatEther(args.amount ?? args[2])),
      blockNumber: raw.blockNumber,
      txHash: raw.transactionHash,
    });
  }
  bids.sort((a, b) => a.blockNumber - b.blockNumber);

  if (provider) {
    await Promise.all(
      Array.from(new Set(bids.map((b) => b.blockNumber))).map(async (block) => {
        const info = await provider.getBlock(block);
        if (info?.timestamp) blockTimes.set(block, Number(info.timestamp) * 1000);
      }),
    );
  }

  return mapAuctionRow(id, row, bids, blockTimes);
}

export async function fetchMyBidHistory(address: string): Promise<BidHistoryEntry[]> {
  if (!address) return [];
  const contract = await getEscrowContract(false);
  const provider = contract.runner?.provider;
  let myBidLogs: EventLog[] = [];
  try {
    myBidLogs = (await contract.queryFilter(
      contract.filters.BidPlaced(null, address),
      0,
      "latest",
    )) as EventLog[];
  } catch (err) {
    if (provider) {
      const latestBlock = await provider.getBlockNumber().catch(() => 0);
      myBidLogs = (await contract.queryFilter(
        contract.filters.BidPlaced(null, address),
        Math.max(0, latestBlock - 9999),
        "latest",
      )) as EventLog[];
    }
  }

  if (myBidLogs.length === 0) return [];

  const auctionIds = Array.from(
    new Set(myBidLogs.map((log) => String(log.args?.auctionId ?? log.args?.[0]))),
  );

  const events = await loadAuctionEvents(contract);
  const lowerAddress = address.toLowerCase();

  const rows = await Promise.all(
    auctionIds.map(async (id) => {
      const onchain = await contract.auctions(id);
      const auction = await mapAuctionRow(id, onchain, events.bidsByAuction.get(id) ?? [], events.blockTimes);
      const myBids = (events.bidsByAuction.get(id) ?? []).filter(
        (entry) => entry.bidder.toLowerCase() === lowerAddress,
      );
      const myBidAmount = myBids.reduce((max, entry) => Math.max(max, entry.amount), 0);

      const settlement = events.settlements.get(id);
      let result: BidHistoryEntry["result"];
      let finalPrice: number;

      if (settlement) {
        finalPrice = settlement.amount;
        result = settlement.winner.toLowerCase() === lowerAddress ? "WON" : "LOST";
      } else if (auction.status === "ENDED") {
        finalPrice = auction.currentBid;
        result = String(onchain.highestBidder).toLowerCase() === lowerAddress ? "WON" : "LOST";
      } else {
        finalPrice = auction.currentBid;
        result = String(onchain.highestBidder).toLowerCase() === lowerAddress ? "LEADING" : "OUTBID";
      }

      const latestMyBid = myBids[myBids.length - 1];
      const date = latestMyBid && events.blockTimes.has(latestMyBid.blockNumber)
        ? new Date(events.blockTimes.get(latestMyBid.blockNumber)!).toISOString()
        : auction.endTime;

      return {
        id: `bid-${id}`,
        nft: auction.nft,
        myBid: myBidAmount,
        finalPrice,
        result,
        date,
      } satisfies BidHistoryEntry;
    }),
  );

  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function mapAuctionRow(
  id: string,
  row: any,
  bidLog: BidLogEntry[],
  blockTimes: Map<number, number>,
): Promise<Auction> {
  const metadataURI = String(row.metadataURI ?? "");
  const metadata = await fetchAuctionMetadata(metadataURI);
  const nftFromMetadata = metadata.nft as Partial<NFT> | undefined;
  const now = Date.now();
  const startMs = Number(row.startTime) * 1000;
  const endMs = Number(row.endTime) * 1000;
  const status: AuctionStatus = row.settled
    ? "ENDED"
    : now < startMs
      ? "SCHEDULED"
      : now <= endMs
        ? "LIVE"
        : "ENDED";
  const highestBid = Number(formatEther(row.highestBid));
  const startingBid = Number(formatEther(row.startingBid));
  const uniqueBidders = new Set(bidLog.map((entry) => entry.bidder.toLowerCase())).size;

  return {
    id,
    seller: String(row.seller),
    currentBid: highestBid || startingBid,
    bidCount: uniqueBidders,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    status,
    reservePrice: Number(formatEther(row.reservePrice)),
    bidHistory: buildBidHistory(bidLog, blockTimes),
    settled: Boolean(row.settled),
    nft: {
      id: nftFromMetadata?.id ?? `${row.nftContract}:${row.tokenId}`,
      name: nftFromMetadata?.name ?? `Token #${row.tokenId}`,
      image: nftFromMetadata?.image ?? "",
      collection: nftFromMetadata?.collection ?? "On-chain NFT",
      tokenId: String(row.tokenId),
      contractAddress: String(row.nftContract),
      chain: (nftFromMetadata?.chain as Chain | undefined) ?? DEFAULT_CHAIN.name,
      estimatedValueEth: Number(metadata.floorEth ?? 0),
      estimatedValueUsd: 0,
      traits: nftFromMetadata?.traits ?? [],
      priceHistory: [],
    },
  };
}

async function fetchAuctionMetadata(uri: string) {
  if (!uri) return {};
  try {
    if (uri.startsWith("data:application/json")) {
      const [, payload] = uri.split(",", 2);
      const decoded = uri.includes(";base64,") ? atob(payload) : decodeURIComponent(payload);
      return JSON.parse(decoded) as Record<string, unknown>;
    }
    const response = await fetch(normalizeIpfsUrl(uri));
    if (!response.ok) return {};
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
