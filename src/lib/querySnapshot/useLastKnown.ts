import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/** First part of every key this hook keeps — on the snapshot's allowlist. */
export const LAST_KNOWN_KEY = "last-known";

/**
 * A small value the player sees on every visit, shown at once from the last
 * visit while the real answer loads behind it.
 *
 * For numbers derived from a query that cannot go into the boot snapshot
 * itself — one holding Firestore timestamps, or one whose stale copy would be
 * wrong to act on. The caller hands over the JSON-safe bit it shows (`fresh`,
 * undefined while loading); it is kept in a query of its own, which the
 * snapshot saves and restores like any other. Returns the fresh value once
 * there is one, the saved one until then.
 *
 * Keep `fresh` referentially stable (useMemo) — every new object is a write.
 */
export const useLastKnown = <T>(
  name: string,
  uid: string | null | undefined,
  fresh: T | undefined,
): T | undefined => {
  const client = useQueryClient();
  const owner = uid ?? null;

  // Never fetches: it only holds what the effect below, or the boot snapshot,
  // puts under the key, and re-renders when that changes.
  const { data: saved } = useQuery<T | null>({
    queryKey: [LAST_KNOWN_KEY, name, owner],
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (!owner || fresh === undefined) return;
    client.setQueryData([LAST_KNOWN_KEY, name, owner], fresh);
  }, [client, name, owner, fresh]);

  return fresh ?? saved ?? undefined;
};
