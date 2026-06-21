import { useEffect, useState } from "react";

export interface BuyMeACoffeeFunding {
  /** Lifetime total raised (USD). Drives the roadmap tiers. */
  totalRaised: number;
  /** Number of supporters. */
  supporters: number;
  isLoading: boolean;
}

/**
 * Funding data for the roadmap.
 *
 * Fetches the lifetime total from `/api/buy-me-a-coffee`, which sums the real
 * Buy Me a Coffee data server-side (and falls back to this snapshot when no
 * `BMC_ACCESS_TOKEN` is configured). The snapshot also keeps the UI populated
 * during the initial load and if the request fails.
 */
const FUNDING_SNAPSHOT: Omit<BuyMeACoffeeFunding, "isLoading"> = {
  totalRaised: 0,
  supporters: 0,
};

export const useBuyMeACoffeeFunding = (): BuyMeACoffeeFunding => {
  const [funding, setFunding] = useState<BuyMeACoffeeFunding>({
    ...FUNDING_SNAPSHOT,
    isLoading: true,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/buy-me-a-coffee")
      .then((res) => {
        if (!res.ok) throw new Error(`funding responded ${res.status}`);
        return res.json();
      })
      .then((data: { totalRaised: number; supporters: number }) => {
        if (!active) return;
        setFunding({
          totalRaised: data.totalRaised,
          supporters: data.supporters,
          isLoading: false,
        });
      })
      .catch(() => {
        if (active) setFunding({ ...FUNDING_SNAPSHOT, isLoading: false });
      });
    return () => {
      active = false;
    };
  }, []);

  return funding;
};
