import { useEffect, useState } from "react";

export function useCountdown(target: string | Date) {
  const end = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, end - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const expired = diff === 0;
  const label = expired ? "Ended"
    : d > 0 ? `${d}d ${h}h ${m}m`
    : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return { label, expired, d, h, m, s };
}
