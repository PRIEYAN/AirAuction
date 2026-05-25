import type { Chain } from "@/types/auction";

export interface ChainConfig {
  id: number;
  name: Chain;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  testnet: boolean;
}

export const MANTLE_SEPOLIA: ChainConfig = {
  id: 5003,
  name: "Mantle",
  rpcUrl: "https://rpc.sepolia.mantle.xyz",
  explorerUrl: "https://explorer.sepolia.mantle.xyz",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  testnet: true,
};

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  [MANTLE_SEPOLIA.id]: MANTLE_SEPOLIA,
};

export const DEFAULT_CHAIN = MANTLE_SEPOLIA;
