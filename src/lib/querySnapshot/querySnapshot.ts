import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * The dashboard's React Query results from the last visit, put back into the
 * cache on boot so the widgets draw at once and refetch in the background.
 *
 * Restored entries keep the time they were fetched, so they are already stale
 * and every query that mounts refetches as usual — the copy only fills the gap
 * until the fresh answer lands.
 *
 * Only keys listed here are saved, and only ones whose data survives a JSON
 * round trip: a Firestore `Timestamp` comes back as a plain object without
 * `toDate()`, so queries holding them (user songs, onboarding quests) stay out.
 * The copy belongs to one uid and is dropped on sign-out.
 */

const STORAGE_KEY = "rq:query-snapshot";
// Bump when a persisted query changes shape, so old copies are ignored.
const VERSION = 1;
const MAX_AGE = 3 * 24 * 60 * 60 * 1000;
// localStorage is ~5 MB per origin and shared with everything else on it.
const MAX_BYTES = 512 * 1024;

const PERSISTED_KEY_PREFIXES: readonly QueryKey[] = [
  ["dashboard-layout"],
  ["daily-exercise-leaderboard"],
  ["buyMeACoffeeFunding"],
  ["support-team"],
  ["arsenal", "inventory"],
  ["song-tiers"],
];

interface PersistedQuery {
  queryKey: QueryKey;
  data: unknown;
  dataUpdatedAt: number;
}

interface StoredQuerySnapshot {
  v: number;
  uid: string;
  savedAt: number;
  queries: PersistedQuery[];
}

export const isPersistedQueryKey = (queryKey: QueryKey) =>
  PERSISTED_KEY_PREFIXES.some((prefix) =>
    prefix.every((part, index) => queryKey[index] === part),
  );

export const restoreQuerySnapshot = (
  client: QueryClient,
  uid: string,
  now = Date.now(),
) => {
  let stored: Partial<StoredQuerySnapshot>;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    stored = JSON.parse(raw) as Partial<StoredQuerySnapshot>;
  } catch {
    return;
  }

  if (
    stored.v !== VERSION ||
    stored.uid !== uid ||
    typeof stored.savedAt !== "number" ||
    now - stored.savedAt > MAX_AGE ||
    !Array.isArray(stored.queries)
  ) {
    return;
  }

  for (const { queryKey, data, dataUpdatedAt } of stored.queries) {
    if (!Array.isArray(queryKey) || !isPersistedQueryKey(queryKey)) continue;
    // Something may have fetched it already; never step back over that.
    const current = client.getQueryState(queryKey);
    if (current && current.dataUpdatedAt >= dataUpdatedAt) continue;
    client.setQueryData(queryKey, data, { updatedAt: dataUpdatedAt });
  }
};

export const writeQuerySnapshot = (
  client: QueryClient,
  uid: string,
  now = Date.now(),
) => {
  const queries: PersistedQuery[] = client
    .getQueryCache()
    .findAll({
      predicate: (query) =>
        query.state.status === "success" &&
        query.state.data !== undefined &&
        isPersistedQueryKey(query.queryKey),
    })
    .map((query) => ({
      queryKey: query.queryKey,
      data: query.state.data,
      dataUpdatedAt: query.state.dataUpdatedAt,
    }));

  try {
    const payload = JSON.stringify({ v: VERSION, uid, savedAt: now, queries });
    if (payload.length > MAX_BYTES) return;
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Storage full or blocked: the next boot just fetches as before.
  }
};

export const clearQuerySnapshot = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored that could be shown.
  }
};
