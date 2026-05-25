import type { Chain } from "@/types/auction";

export const chainColors: Record<Chain, string> = {
  Ethereum: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
  Base: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  Polygon: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  Mantle: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
};
