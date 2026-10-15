import type { DuelView } from "feature/duels/types/duel.types";

/** "21h 14m", "45m" — the countdown format the daily exercise uses too. */
export const formatTimeLeft = (ms: number): string => {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

/** "17:42:09" — the live duel clock. Never negative: a finished clock reads 00:00:00. */
export const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};

/** "+16", "−16", "±0" — a rating change, signed the way a scoreboard prints it. */
export const formatRatingDelta = (delta: number): string =>
  delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : "±0";

type DecidedResult = "won" | "lost" | "draw";

/**
 * Settled duels that moved the rating, in the order they were settled — what a
 * form guide and a trend are drawn from. Not by deadline: a duel both players
 * finished early settles ahead of an older one still running.
 */
const decided = (recent: readonly DuelView[]): DuelView[] =>
  recent
    .filter(
      (duel) =>
        duel.status === "finished" &&
        duel.result !== null &&
        duel.result !== "void",
    )
    .sort((a, b) => (a.settledAt ?? a.endsAt) - (b.settledAt ?? b.endsAt));

/** The last `count` results, oldest first, newest on the right — the way a form guide reads. */
export const recentForm = (
  recent: readonly DuelView[],
  count = 5,
): DecidedResult[] =>
  decided(recent)
    .slice(-count)
    .map((duel) => duel.result as DecidedResult);

/**
 * The rating before the first of the recent duels and after each of them —
 * the line a sparkline draws. Empty when there is nothing to draw a line through.
 */
export const ratingTrail = (recent: readonly DuelView[]): number[] => {
  const duels = decided(recent);
  if (duels.length === 0) return [];
  return [
    duels[0].me.ratingBefore,
    ...duels.map((duel) => duel.me.ratingAfter ?? duel.me.ratingBefore),
  ];
};

/**
 * How a settled duel split between the two best runs, as the viewer's share
 * of their sum (0–1). Null when neither side scored — there is no split to show.
 */
export const scoreShare = (mine: number, theirs: number): number | null =>
  mine + theirs > 0 ? mine / (mine + theirs) : null;
