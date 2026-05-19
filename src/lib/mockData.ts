export type Chain = "Ethereum" | "Base" | "Polygon";
export type AuctionStatus = "LIVE" | "SCHEDULED" | "ENDED";

export interface Trait { type: string; value: string; rarity?: string }
export interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  tokenId: string;
  contractAddress: string;
  chain: Chain;
  estimatedValueEth: number;
  estimatedValueUsd: number;
  traits: Trait[];
  priceHistory: { date: string; price: number }[];
}
export interface Bid { bidder: string; amount: number; time: string }
export interface Auction {
  id: string;
  nft: NFT;
  seller: string;
  currentBid: number;
  bidCount: number;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  reservePrice: number;
  bidHistory: Bid[];
}
export interface BidHistoryEntry {
  id: string;
  nft: NFT;
  myBid: number;
  finalPrice: number;
  result: "WON" | "OUTBID" | "LOST";
  date: string;
}

const pic = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const traitsFor = (i: number): Trait[] => [
  { type: "Background", value: ["Cosmic", "Void", "Neon", "Mist"][i % 4], rarity: "12%" },
  { type: "Body", value: ["Chrome", "Obsidian", "Ivory", "Ember"][i % 4], rarity: "8%" },
  { type: "Eyes", value: ["Laser", "Hypnotic", "Glitch", "Solar"][i % 4], rarity: "5%" },
  { type: "Aura", value: ["Mythic", "Rare", "Epic", "Legendary"][i % 4], rarity: "2%" },
];

const priceHist = (base: number) =>
  Array.from({ length: 6 }, (_, i) => ({
    date: `2025-0${i + 1}-15`,
    price: +(base * (0.7 + i * 0.08 + Math.random() * 0.1)).toFixed(2),
  }));

const nftNames = [
  "Neon Genesis #042", "Void Walker #117", "Chromatic Dream #08", "Cyber Oracle #231",
  "Eclipse Phantom #19", "Quantum Drifter #76", "Solar Reverie #54", "Obsidian Muse #03",
  "Ethereal Glitch #88", "Cosmic Shard #12", "Liminal Echo #99", "Hollow Ember #45",
];
const collections = ["Voidframe", "Chromacore", "Lumen Society", "Phantom Layer"];
const chains: Chain[] = ["Ethereum", "Base", "Polygon"];
const rand0x = (s: string) =>
  "0x" + Array.from(s.padEnd(40, "f")).map((c) => c.charCodeAt(0).toString(16)).join("").slice(0, 40);

export const myNFTs: NFT[] = Array.from({ length: 8 }, (_, i) => {
  const eth = +(0.8 + Math.random() * 6).toFixed(2);
  return {
    id: `nft-${i + 1}`,
    name: nftNames[i],
    image: pic(`nft${i + 1}`),
    collection: collections[i % collections.length],
    tokenId: String(1000 + i * 37),
    contractAddress: rand0x(`contract${i}`),
    chain: chains[i % 3],
    estimatedValueEth: eth,
    estimatedValueUsd: Math.round(eth * 3200),
    traits: traitsFor(i),
    priceHistory: priceHist(eth),
  };
});

const allNFTs: NFT[] = [
  ...myNFTs,
  ...Array.from({ length: 8 }, (_, i) => {
    const eth = +(0.5 + Math.random() * 8).toFixed(2);
    return {
      id: `nft-ext-${i + 1}`,
      name: nftNames[(i + 4) % nftNames.length].replace("#", "#X"),
      image: pic(`nftext${i + 1}`),
      collection: collections[(i + 1) % collections.length],
      tokenId: String(2000 + i * 41),
      contractAddress: rand0x(`extcontract${i}`),
      chain: chains[(i + 1) % 3],
      estimatedValueEth: eth,
      estimatedValueUsd: Math.round(eth * 3200),
      traits: traitsFor(i + 1),
      priceHistory: priceHist(eth),
    };
  }),
];

const wallet = (s: string) => rand0x(s);

const mkBidHistory = (base: number): Bid[] =>
  Array.from({ length: 6 }, (_, i) => ({
    bidder: wallet(`bidder${i}-${base}`),
    amount: +(base + i * 0.15).toFixed(2),
    time: `${i + 1}m ago`,
  })).reverse();

const now = Date.now();
const inHours = (h: number) => new Date(now + h * 3600_000).toISOString();
const agoHours = (h: number) => new Date(now - h * 3600_000).toISOString();

export const auctions: Auction[] = Array.from({ length: 12 }, (_, i) => {
  const nft = allNFTs[i % allNFTs.length];
  const status: AuctionStatus = i < 6 ? "LIVE" : i < 9 ? "SCHEDULED" : "ENDED";
  const base = +(nft.estimatedValueEth * 0.6).toFixed(2);
  return {
    id: `auction-${i + 1}`,
    nft,
    seller: wallet(`seller${i}`),
    currentBid: +(base + Math.random() * 1.5).toFixed(2),
    bidCount: 4 + (i % 9),
    startTime: status === "SCHEDULED" ? inHours(i * 6 + 4) : agoHours(2),
    endTime: status === "LIVE" ? inHours(1 + i * 0.5)
      : status === "SCHEDULED" ? inHours(i * 6 + 28)
      : agoHours(i),
    status,
    reservePrice: base,
    bidHistory: mkBidHistory(base),
  };
});

export const myAuctions: Auction[] = Array.from({ length: 6 }, (_, i) => {
  const nft = myNFTs[i % myNFTs.length];
  const status: AuctionStatus = i < 3 ? "LIVE" : i < 5 ? "SCHEDULED" : "ENDED";
  const base = +(nft.estimatedValueEth * 0.65).toFixed(2);
  return {
    id: `my-auction-${i + 1}`,
    nft,
    seller: wallet("me"),
    currentBid: +(base + Math.random() * 2).toFixed(2),
    bidCount: 3 + i * 2,
    startTime: status === "SCHEDULED" ? inHours(8 + i * 6) : agoHours(3),
    endTime: status === "LIVE" ? inHours(2 + i)
      : status === "SCHEDULED" ? inHours(30 + i * 6)
      : agoHours(i * 4),
    status,
    reservePrice: base,
    bidHistory: mkBidHistory(base),
  };
});

export const myBidHistory: BidHistoryEntry[] = Array.from({ length: 10 }, (_, i) => {
  const nft = allNFTs[(i + 3) % allNFTs.length];
  const result = (["WON", "OUTBID", "LOST"] as const)[i % 3];
  const myBid = +(nft.estimatedValueEth * (0.4 + Math.random() * 0.5)).toFixed(2);
  const finalPrice = result === "WON" ? myBid : +(myBid + 0.3 + Math.random()).toFixed(2);
  return {
    id: `bid-${i + 1}`,
    nft,
    myBid,
    finalPrice,
    result,
    date: new Date(now - i * 86400_000 * 2).toISOString(),
  };
});

export const mockWallet = {
  address: "0x9A3f7C4E12bB85d09e7A1F2c6eC3aA77B91dE042",
  totalNFTs: myNFTs.length,
  totalValueEth: +myNFTs.reduce((s, n) => s + n.estimatedValueEth, 0).toFixed(2),
  joinedDate: "March 2023",
};

export const platformStats = {
  totalVolumeEth: 184_392,
  nftsSold: 12_847,
  activeBidders: 3_204,
};

export const chainColors: Record<Chain, string> = {
  Ethereum: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
  Base: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  Polygon: "bg-purple-500/20 text-purple-200 border-purple-400/30",
};

export const truncateAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
