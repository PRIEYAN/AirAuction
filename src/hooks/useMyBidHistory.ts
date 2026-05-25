import { useEffect, useState } from "react";
import { fetchMyBidHistory } from "@/services/auctionContract";
import type { BidHistoryEntry } from "@/types/auction";

export function useMyBidHistory(address: string | undefined) {
  const [history, setHistory] = useState<BidHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) {
      setHistory([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchMyBidHistory(address)
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load bid history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return { history, loading, error };
}
