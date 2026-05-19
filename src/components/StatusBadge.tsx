import type { AuctionStatus } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const map: Record<AuctionStatus, string> = {
  LIVE: "bg-red-500/15 text-red-300 border-red-500/40",
  SCHEDULED: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  ENDED: "bg-white/10 text-white/60 border-white/20",
};

export function StatusBadge({ status, className }: { status: AuctionStatus; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
      map[status], className,
    )}>
      {status === "LIVE" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
      {status}
    </span>
  );
}
