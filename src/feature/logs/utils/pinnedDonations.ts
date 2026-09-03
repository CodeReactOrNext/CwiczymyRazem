import { MAX_DAILY_DONATIONS } from "feature/logs/utils/activityFame";

import {
  type AnyFirebaseLog,
  getLogDayKey,
  isFirebaseLogsDonation,
} from "./groupConsecutiveLogs";

/**
 * Today's donations, lifted out of the feed's chronological order and shown first.
 *
 * Money is the rarest thing that happens in the feed and the easiest to scroll past, so for the
 * rest of the day the coffees sit above the practice reports instead of sinking under them. Only
 * donations matched to an account by email are pinned — an anonymous one has no player to
 * congratulate, so it stays exactly where its timestamp puts it.
 *
 * Past the day's fourth, a donation drops out of the feed entirely rather than pushing the rest of
 * the activity off the screen; the money is still recorded, it just stops getting its own card.
 */
export interface PinnedDonationsSplit<T extends AnyFirebaseLog> {
  /** Today's matched donations, newest first — rendered above everything else. */
  pinned: T[];
  /** Everything else, in the order the feed streamed it. */
  rest: T[];
}

/** Whether this log is a donation the feed should pin: matched to an account, and from `dayKey`. */
const isPinnableDonation = (log: AnyFirebaseLog, dayKey: string): boolean =>
  isFirebaseLogsDonation(log) &&
  Boolean(log.uid) &&
  getLogDayKey(log) === dayKey;

/**
 * Splits the feed into the donations pinned to the top and the rest of it. `logs` arrives newest
 * first, so the day's newest donations are the ones that make the cut.
 */
export const splitPinnedDonations = <T extends AnyFirebaseLog>(
  logs: T[],
  now: Date = new Date(),
): PinnedDonationsSplit<T> => {
  const dayKey = now.toISOString().slice(0, 10);
  const pinned: T[] = [];
  const rest: T[] = [];

  for (const log of logs) {
    if (!isPinnableDonation(log, dayKey)) {
      rest.push(log);
      continue;
    }

    if (pinned.length < MAX_DAILY_DONATIONS) pinned.push(log);
  }

  return { pinned, rest };
};
