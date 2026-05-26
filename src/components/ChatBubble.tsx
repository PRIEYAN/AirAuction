import { cn } from "@/lib/utils";

export function ChatBubble({
  who, text, mine,
}: { who: string; text: string; mine?: boolean }) {
  return (
    <div className={cn("flex gap-2", mine && "flex-row-reverse")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
        mine ? "bg-white text-black" : "border border-white/15 bg-white/5 text-white",
      )}>{mine ? "ME" : "AI"}</div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
        mine ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white/90",
      )}>
        <div className="mb-0.5 text-[10px] uppercase tracking-wider opacity-50">{who}</div>
        {text}
      </div>
    </div>
  );
}
