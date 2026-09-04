import { getNextDailyReset } from "feature/arsenal/data/dailyCase";
import { getTraderRestockAt } from "feature/arsenal/data/traderShop";
import { weekEnd } from "feature/communityGoal/utils/goalWeek";
import { cycleEnd } from "feature/supporterCase/utils/caseCycle";

/**
 * Which clock a rollover runs on.
 *
 * `server` is UTC and identical for everyone — the only thing a shared deadline
 * can be stated in. `local` is the viewer's own midnight, used by the mechanics
 * that are about one player's own habit rather than a shared race: the streak
 * and the daily quest (see `getServerDateKey` for why).
 */
export type ResetScope = "server" | "local";

export interface ResetEntry {
  id: string;
  /** What the player sees roll over. */
  label: string;
  /** One line on what actually resets, for the expanded list. */
  detail: string;
  scope: ResetScope;
  /** Epoch ms of the next rollover. */
  nextResetAt: number;
}

const MS_PER_DAY = 86_400_000;

/** Midnight UTC that ends the current server day. */
export const getServerDayEnd = (now: Date = new Date()): number =>
  (Math.floor(now.getTime() / MS_PER_DAY) + 1) * MS_PER_DAY;

/** Midnight in the viewer's own zone that ends their current local day. */
export const getLocalDayEnd = (now: Date = new Date()): number =>
  new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  ).getTime();

/** Midnight UTC on the first of next month — when the season and board turn over. */
export const getServerMonthEnd = (now: Date = new Date()): number =>
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);

/**
 * Every rollover the app runs, and when the next one lands.
 *
 * Deliberately assembled from the modules that already own each boundary rather
 * than re-deriving any of them here. A clock that computes its own idea of when
 * the trader restocks is a fourth source of truth, and the whole point of this
 * module is that there are only two — and that the player can see which is
 * which. Entries that share an instant are merged into one row, because two
 * identical countdowns side by side read as a bug.
 *
 * Sorted soonest first, so the caller can show `[0]` as "what happens next".
 */
export const getResetSchedule = (now: Date = new Date()): ResetEntry[] => {
  const entries: ResetEntry[] = [
    {
      id: "daily",
      label: "Daily reset",
      detail: "A fresh daily Fame bonus.",
      scope: "server",
      nextResetAt: getServerDayEnd(now),
    },
    {
      id: "trader",
      label: "Trader restock",
      detail: "The trader clears the counter and lays out new stock.",
      scope: "server",
      nextResetAt: getTraderRestockAt(now),
    },
    {
      id: "case-pool",
      label: "Featured case pool",
      detail: "New guitars and effects rotate into the daily case.",
      scope: "server",
      nextResetAt: getNextDailyReset(now).getTime(),
    },
    {
      id: "weekly",
      label: "Weekly goals",
      detail: "Community Goal and guild challenges start a new week.",
      scope: "server",
      nextResetAt: weekEnd(now).getTime(),
    },
    {
      id: "supporter-slate",
      label: "Supporter slate",
      detail: "A new pair of supporter cases goes up for voting.",
      scope: "server",
      nextResetAt: cycleEnd(now).getTime(),
    },
    {
      id: "monthly",
      label: "Season & Monthly Challenge",
      detail: "The leaderboard resets and a new challenge board opens.",
      scope: "server",
      nextResetAt: getServerMonthEnd(now),
    },
    {
      id: "streak",
      label: "Your practice day",
      detail:
        "Daily Quests draw a new set and the streak wants a session before then — this one follows your timezone, not the server.",
      scope: "local",
      nextResetAt: getLocalDayEnd(now),
    },
  ];

  // Rows landing on the same instant (the weekly and the supporter slate share
  // every other Monday) collapse into the earlier-listed one.
  const merged: ResetEntry[] = [];
  for (const entry of entries) {
    const twin = merged.find((seen) => seen.nextResetAt === entry.nextResetAt);
    if (twin) {
      twin.label = `${twin.label} · ${entry.label}`;
      twin.detail = `${twin.detail} ${entry.detail}`;
      continue;
    }
    merged.push(entry);
  }

  return merged.sort((a, b) => a.nextResetAt - b.nextResetAt);
};

/** The server clock as `HH:MM`, which is the number the sidebar leads with. */
export const formatServerTime = (now: Date = new Date()): string =>
  `${String(now.getUTCHours()).padStart(2, "0")}:${String(
    now.getUTCMinutes(),
  ).padStart(2, "0")}`;

/**
 * A countdown at the coarsest useful resolution: days once there is more than a
 * day left, then hours and minutes, then minutes alone in the last hour.
 *
 * No seconds anywhere. This clock sits in the sidebar of every page, and a digit
 * changing once a second in the corner of the eye is a distraction on a screen
 * someone is trying to practise in front of.
 */
export const formatTimeLeft = (msLeft: number): string => {
  const total = Math.max(0, msLeft);
  const days = Math.floor(total / MS_PER_DAY);
  const hours = Math.floor(total / 3_600_000) % 24;
  const minutes = Math.floor(total / 60_000) % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
