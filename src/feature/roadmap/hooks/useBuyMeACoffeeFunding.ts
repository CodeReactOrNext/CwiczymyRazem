import { useQuery } from "@tanstack/react-query";

export interface BuyMeACoffeeFunding {
  /** Lifetime total raised (USD). Drives the roadmap tiers. */
  totalRaised: number;
  /** Number of supporters. */
  supporters: number;
  /** Raised since the start of the current month (USD) — covers running costs. */
  raisedThisMonth: number;
  isLoading: boolean;
}

/**
 * Funding data for the roadmap.
 *
 * Fetches the lifetime total from `/api/buy-me-a-coffee`, which sums the real
 * Buy Me a Coffee data server-side (and falls back to this snapshot when no
 * `BMC_ACCESS_TOKEN` is configured). The snapshot also keeps the UI populated
 * during the initial load and if the request fails.
 *
 * Four separate components read this (the support banner, the roadmap pitch,
 * the support pulse and the support modal), and more than one of them is on
 * screen at a time. React Query is what collapses those into a single request:
 * a plain `fetch` in an effect fired once per mount, which is how an endpoint
 * nobody looks at twice ended up being called ~500 times a day.
 */
const FUNDING_SNAPSHOT: Omit<BuyMeACoffeeFunding, "isLoading"> = {
  totalRaised: 0,
  supporters: 0,
  raisedThisMonth: 0,
};

/**
 * Matched to the `s-maxage` the endpoint sends: refetching sooner than the edge
 * is willing to answer buys nothing but a round trip. `gcTime` follows it so the
 * numbers survive navigating away from the roadmap and back, rather than being
 * dropped after the default five minutes and fetched again.
 */
const FUNDING_CACHE_MS = 60 * 60 * 1000;

interface FundingPayload {
  totalRaised: number;
  supporters: number;
  raisedThisMonth?: number;
}

const fetchFunding = async (): Promise<
  Omit<BuyMeACoffeeFunding, "isLoading">
> => {
  const res = await fetch("/api/buy-me-a-coffee");
  if (!res.ok) throw new Error(`funding responded ${res.status}`);

  const data = (await res.json()) as FundingPayload;
  return {
    totalRaised: data.totalRaised,
    supporters: data.supporters,
    raisedThisMonth: data.raisedThisMonth ?? 0,
  };
};

export const useBuyMeACoffeeFunding = (): BuyMeACoffeeFunding => {
  const { data, isPending } = useQuery({
    queryKey: ["buyMeACoffeeFunding"],
    queryFn: fetchFunding,
    staleTime: FUNDING_CACHE_MS,
    gcTime: FUNDING_CACHE_MS,
  });

  // A failed request leaves `data` undefined and the status settled, so the
  // callers below see the snapshot with `isLoading: false` — the same thing the
  // hand-rolled `.catch()` did before.
  return { ...(data ?? FUNDING_SNAPSHOT), isLoading: isPending };
};
