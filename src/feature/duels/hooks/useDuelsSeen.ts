import type { DuelsSeenState } from "feature/duels/utils/duelScreens";
import { useCallback, useSyncExternalStore } from "react";

/**
 * What this browser remembers about the duels page: which results were already
 * shown on the result screen, and whether the intro was seen. A per-device
 * convenience — losing it only means a result screen or the intro shows again.
 */
const STORAGE_KEY = "duels.seen.v1";
/** Results kept as seen; older ones fall out of `recent` long before this. */
const MAX_IDS = 40;
/** On a first visit, results settled in the last few days still get their screen. */
const FIRST_VISIT_LOOKBACK_MS = 3 * 24 * 3_600_000;

let cache: DuelsSeenState | null = null;
const listeners = new Set<() => void>();

const isSeenState = (value: unknown): value is DuelsSeenState => {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return (
    typeof state.since === "number" &&
    Array.isArray(state.ids) &&
    typeof state.onboarded === "boolean"
  );
};

const write = (next: DuelsSeenState) => {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: the in-memory copy still covers this visit.
  }
  listeners.forEach((listener) => listener());
};

const getSnapshot = (): DuelsSeenState => {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (isSeenState(parsed)) cache = parsed;
  } catch {
    // Unreadable — start over below.
  }
  cache ??= {
    since: Date.now() - FIRST_VISIT_LOOKBACK_MS,
    ids: [],
    onboarded: false,
  };
  return cache;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Null on the server and in the first client render, so hydration matches. */
const getServerSnapshot = (): DuelsSeenState | null => null;

export const useDuelsSeen = () => {
  const seen = useSyncExternalStore<DuelsSeenState | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const markResultSeen = useCallback((duelId: string) => {
    const current = getSnapshot();
    if (current.ids.includes(duelId)) return;
    write({ ...current, ids: [duelId, ...current.ids].slice(0, MAX_IDS) });
  }, []);

  const markOnboarded = useCallback(() => {
    write({ ...getSnapshot(), onboarded: true });
  }, []);

  return { seen, markResultSeen, markOnboarded };
};
