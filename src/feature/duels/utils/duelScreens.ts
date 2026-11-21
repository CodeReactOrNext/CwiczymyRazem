import type {
  DuelOverview,
  DuelRankingEntry,
  DuelView,
} from "feature/duels/types/duel.types";
import {
  DUEL_PROVISIONAL_DUELS,
  nextRating,
} from "feature/duels/utils/duelRules";

// ── Tabs ─────────────────────────────────────────────────────────────────────

export const DUELS_TABS = ["duels", "ranking", "history"] as const;
export type DuelsTab = (typeof DUELS_TABS)[number];

/** The tab a `?tab=` value names, or the duels themselves for anything else. */
export const parseDuelsTab = (
  param: string | string[] | undefined,
): DuelsTab =>
  typeof param === "string" && (DUELS_TABS as readonly string[]).includes(param)
    ? (param as DuelsTab)
    : "duels";

// ── Slots ────────────────────────────────────────────────────────────────────

export type DuelSlot =
  | { kind: "active"; duel: DuelView }
  | { kind: "searching"; ticketId: string; expiresAt: number }
  | { kind: "free" };

/**
 * The player's open places, in a fixed order: running duels (the one ending
 * first leads), then tickets still looking, then whatever is free.
 */
export const buildDuelSlots = (
  overview: Pick<DuelOverview, "active" | "tickets">,
  max: number,
): DuelSlot[] => {
  const active: DuelSlot[] = [...overview.active]
    .sort((a, b) => a.endsAt - b.endsAt)
    .map((duel) => ({ kind: "active", duel }));
  const searching: DuelSlot[] = overview.tickets.map((ticket) => ({
    kind: "searching",
    ticketId: ticket.id,
    expiresAt: ticket.expiresAt,
  }));
  const taken = [...active, ...searching];
  const free: DuelSlot[] = Array.from(
    { length: Math.max(0, max - taken.length) },
    () => ({ kind: "free" }),
  );
  return [...taken, ...free];
};

/** Paired this recently and nobody has played yet — the tile says "new". */
export const DUEL_NEW_FOR_MS = 15 * 60_000;

export const isFreshDuel = (duel: DuelView, now: number): boolean =>
  now - duel.createdAt < DUEL_NEW_FOR_MS &&
  duel.me.attempts === 0 &&
  duel.opponent.attempts === 0;

// ── Results waiting to be seen ───────────────────────────────────────────────

/** What this browser remembers about the duels page. */
export interface DuelsSeenState {
  /** Results settled before this are old news — they never get the result screen. */
  since: number;
  /** Results already shown. */
  ids: string[];
  /** The three intro screens were seen (or skipped). */
  onboarded: boolean;
}

/**
 * The newest settled duel the player hasn't been shown yet — the one the
 * "Result ready" banner opens. Void duels moved nothing, so they don't count.
 */
export const unseenResult = (
  recent: readonly DuelView[],
  seen: Pick<DuelsSeenState, "since" | "ids">,
): DuelView | null =>
  [...recent]
    .filter(
      (duel) =>
        duel.status === "finished" &&
        duel.result !== null &&
        duel.result !== "void" &&
        (duel.settledAt ?? duel.endsAt) >= seen.since &&
        !seen.ids.includes(duel.id),
    )
    .sort((a, b) => (b.settledAt ?? b.endsAt) - (a.settledAt ?? a.endsAt))[0] ??
  null;

// ── Ranking ──────────────────────────────────────────────────────────────────

/**
 * How far the next place up is: the rating that beats the player listed one
 * place above. Null when there is nobody above, the player is unranked, or the
 * place above is past the end of the list the server sends.
 */
export const rankGap = (
  overview: Pick<DuelOverview, "isRated" | "rank" | "rating" | "ranking">,
): { place: number; points: number } | null => {
  if (!overview.isRated || !overview.rank || overview.rank <= 1) return null;
  const above = overview.ranking[overview.rank - 2];
  if (!above) return null;
  return {
    place: overview.rank - 1,
    points: Math.max(1, above.rating - overview.rating + 1),
  };
};

export interface RankRowEntry extends Pick<
  DuelRankingEntry,
  "displayName" | "avatar" | "rating" | "wins" | "losses"
> {
  key: string;
  place: number;
  isMe: boolean;
}

/**
 * A few rows around the player for the side panel: the places just above and
 * below when the player is on the list, otherwise the last listed place with
 * the player under it. Unranked players see the top three.
 */
export const rankNeighbours = (
  overview: Pick<
    DuelOverview,
    "isRated" | "rank" | "rating" | "ranking" | "wins" | "losses"
  >,
  uid: string | null,
  me: { displayName: string; avatar: string },
): RankRowEntry[] => {
  const listed = overview.ranking.map(
    (entry, i): RankRowEntry => ({
      key: entry.userId,
      displayName: entry.displayName,
      avatar: entry.avatar,
      rating: entry.rating,
      wins: entry.wins,
      losses: entry.losses,
      place: i + 1,
      isMe: entry.userId === uid,
    }),
  );
  const myIndex = listed.findIndex((row) => row.isMe);
  if (myIndex >= 0) {
    const start = Math.max(0, Math.min(myIndex - 1, listed.length - 3));
    return listed.slice(start, start + 3);
  }
  if (!overview.isRated || !overview.rank || listed.length === 0) {
    return listed.slice(0, 3);
  }
  const myRow: RankRowEntry = {
    key: uid ?? "me",
    displayName: me.displayName,
    avatar: me.avatar,
    rating: overview.rating,
    wins: overview.wins,
    losses: overview.losses,
    place: overview.rank,
    isMe: true,
  };
  return [listed[listed.length - 1], myRow];
};

// ── ELO explainer ────────────────────────────────────────────────────────────

export interface EloExampleRow {
  opponent: number;
  strength: "stronger" | "equal" | "weaker";
  win: number;
  draw: number;
  loss: number;
}

/**
 * What a win, a draw and a loss would do to `rating` against a stronger, an
 * equal and a weaker opponent — from the real formula, past the provisional
 * duels, so the table in "How it works" can never drift from the code.
 */
export const eloExamples = (rating: number, spread = 200): EloExampleRow[] =>
  (
    [
      [spread, "stronger"],
      [0, "equal"],
      [-spread, "weaker"],
    ] as const
  ).map(([offset, strength]) => {
    const opponent = rating + offset;
    const delta = (actual: 0 | 0.5 | 1) =>
      nextRating(rating, DUEL_PROVISIONAL_DUELS, opponent, actual) - rating;
    return {
      opponent,
      strength,
      win: delta(1),
      draw: delta(0.5),
      loss: delta(0),
    };
  });
