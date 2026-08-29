import { weekStart } from "feature/communityGoal/utils/goalWeek";

/**
 * How long one supporter slate runs.
 *
 * Two weeks, and Monday-anchored like everything else in the app.
 *
 * A shorter cycle was tempting — more votes, more churn — but a slate is only
 * worth voting on if there is time to save the Fame for the case and actually
 * chase what won. A week would mean the winners of a Friday vote are gone
 * before half the players have practised enough to afford a 300-Fame case.
 *
 * Two weeks is also often enough that missing one slate is not missing the
 * season. A 10-day cycle would have met the same floor but drifts across
 * weekdays, which puts the rollover on a Wednesday one month and a Sunday the
 * next — every other rhythm here starts on a Monday.
 */
export const CYCLE_WEEKS = 2;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** A Monday. Fixes the phase so cycles never shift by a week after a deploy. */
const ANCHOR_MONDAY = Date.UTC(2026, 0, 5);

/** Midnight UTC on the Monday the containing cycle began. */
export const cycleStart = (date: Date = new Date()): Date => {
  const monday = weekStart(date);
  const weeksFromAnchor = Math.floor(
    (monday.getTime() - ANCHOR_MONDAY) / WEEK_MS,
  );
  // Modulo that stays positive for dates before the anchor.
  const offset = ((weeksFromAnchor % CYCLE_WEEKS) + CYCLE_WEEKS) % CYCLE_WEEKS;

  return new Date(monday.getTime() - offset * WEEK_MS);
};

export const cycleEnd = (date: Date = new Date()): Date =>
  new Date(cycleStart(date).getTime() + CYCLE_WEEKS * WEEK_MS);

/**
 * The cycle's own start date, e.g. "2026-08-24". Sortable, and it says when the
 * slate went up without needing a lookup.
 */
export const cycleIdOf = (date: Date = new Date()): string =>
  cycleStart(date).toISOString().slice(0, 10);

export const nextCycleId = (date: Date = new Date()): string =>
  cycleIdOf(cycleEnd(date));

/** Whole days until the slate is replaced — what the panel counts down. */
export const daysLeftInCycle = (date: Date = new Date()): number =>
  Math.max(
    0,
    Math.ceil(
      (cycleEnd(date).getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
    ),
  );
