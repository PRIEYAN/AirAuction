import { chainColors, type Chain } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function ChainBadge({ chain, className }: { chain: Chain; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
      chainColors[chain], className,
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {chain}
    </span>
  );
}
