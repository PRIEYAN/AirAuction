import { useEffect, useState } from "react";
import { fetchOnchainAuctions } from "./auctionContract";
import type { Auction } from "./mockData";

export function useAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = () => {
    setLoading(true);
    setError("");
    fetchOnchainAuctions()
      .then(setAuctions)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load auctions."))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  return { auctions, loading, error, refresh };
}
