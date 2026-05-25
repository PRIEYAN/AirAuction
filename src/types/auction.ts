export type Chain = "Ethereum" | "Base" | "Polygon" | "Mantle";
export type AuctionStatus = "LIVE" | "SCHEDULED" | "ENDED";

export interface Trait {
  type: string;
  value: string;
  rarity?: string;
}

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

export interface Bid {
  bidder: string;
  amount: number;
  time: string;
}

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

export type BidResult = "WON" | "LEADING" | "OUTBID" | "LOST";

export interface BidHistoryEntry {
  id: string;
  nft: NFT;
  myBid: number;
  finalPrice: number;
  result: BidResult;
  date: string;
}
