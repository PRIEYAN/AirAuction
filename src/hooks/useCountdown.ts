import { useEffect, useState } from "react";

type CountdownState = {
  label: string;
  expired: boolean;
  d: number;
  h: number;
  m: number;
  s: number;
};

function compute(end: number): CountdownState {
  const diff = Math.max(0, end - Date.now());
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const expired = diff === 0;
  const label = expired
    ? "Ended"
    : d > 0
      ? `${d}d ${h}h ${m}m`
      : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return { label, expired, d, h, m, s };
}

export function useCountdown(target: string | Date) {
  const end = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const [state, setState] = useState<CountdownState>(() => compute(end));

  useEffect(() => {
    setState(compute(end));
    if (Date.now() >= end) return;
    // Tick every second, but only re-render when the displayed label actually changes.
    // For multi-day countdowns this collapses ~60 renders/minute into 1.
    const id = setInterval(() => {
      setState((prev: CountdownState) => {
        const next = compute(end);
        return next.label === prev.label ? prev : next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [end]);

  return state;
}
