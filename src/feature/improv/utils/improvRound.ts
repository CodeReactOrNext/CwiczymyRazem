import { IMPROV_ROUND_DAYS } from "feature/improv/types/improv.types";

const DAY_MS = 24 * 60 * 60 * 1000;
export const IMPROV_ROUND_MS = IMPROV_ROUND_DAYS * DAY_MS;

/**
 * Round 1 starts here (Monday 16 Nov 2026, 00:00 UTC). Every window after it is
 * counted from this instant, so the schedule needs no cron and no stored
 * state: any server, at any time, agrees which round is live.
 */
export const IMPROV_EPOCH_MS = Date.UTC(2026, 10, 16);

/** 0-based window index. Clamped, so a clock before the epoch is still round 1. */
export const improvRoundIndex = (now: number): number =>
  Math.max(0, Math.floor((now - IMPROV_EPOCH_MS) / IMPROV_ROUND_MS));

/** Doc id — zero-padded so ids sort the way the rounds ran. */
export const improvRoundId = (index: number): string =>
  `r${String(index + 1).padStart(4, "0")}`;

export const improvRoundWindow = (
  index: number,
): { startsAt: number; endsAt: number } => {
  const startsAt = IMPROV_EPOCH_MS + index * IMPROV_ROUND_MS;
  return { startsAt, endsAt: startsAt + IMPROV_ROUND_MS };
};

export type ImprovTimeLeft =
  | { unit: "days"; count: number }
  | { unit: "hours"; count: number }
  | { unit: "minutes"; count: number }
  | { unit: "over" };

/** The biggest unit that still says something: "3 days", then "5 hours", then "12 minutes". */
export const improvTimeLeft = (endsAt: number, now: number): ImprovTimeLeft => {
  const ms = endsAt - now;
  if (ms <= 0) return { unit: "over" };
  if (ms >= DAY_MS) return { unit: "days", count: Math.floor(ms / DAY_MS) };
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return { unit: "hours", count: hours };
  return { unit: "minutes", count: Math.max(1, Math.floor(ms / 60_000)) };
};

/** "16.–20.11." — a round's last day is the one before the next round starts. */
export const improvDateRange = (startsAt: number, endsAt: number): string => {
  const start = new Date(startsAt);
  const end = new Date(endsAt - 1);
  const day = (d: Date) => d.getUTCDate();
  const month = (d: Date) => d.getUTCMonth() + 1;
  return month(start) === month(end)
    ? `${day(start)}.–${day(end)}.${month(end)}.`
    : `${day(start)}.${month(start)}.–${day(end)}.${month(end)}.`;
};
