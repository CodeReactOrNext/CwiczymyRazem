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

/**
 * The day the feed pins by, in the `YYYY-MM-DD` form `getLogDayKey` reads off a log. UTC, because
 * that's what the log timestamps are written in — so the pinned set turns over at 02:00 in Poland
 * rather than at midnight.
 */
export const getPinnedDonationsDayKey = (now: Date = new Date()): string =>
  now.toISOString().slice(0, 10);

/**
 * Oldest `logs.timestamp` still belonging to the pinned day — the lower bound the donation query
 * needs. Timestamps are stored as ISO strings, so this compares correctly as a plain string.
 */
export const pinnedDonationsSince = (now: Date = new Date()): string =>
  `${getPinnedDonationsDayKey(now)}T00:00:00.000Z`;

/** Whether this log is a donation the feed should pin: matched to an account, and from `dayKey`. */
const isPinnableDonation = (log: AnyFirebaseLog, dayKey: string): boolean =>
  isFirebaseLogsDonation(log) &&
  Boolean(log.uid) &&
  getLogDayKey(log) === dayKey;

const logId = (log: AnyFirebaseLog): string | undefined =>
  (log as { id?: string }).id;

/**
 * Folds separately-streamed donations back into the feed page.
 *
 * The page is only the newest handful of logs, so a morning coffee scrolls out of it within the
 * hour — and pinning can't lift what was never fetched, which is why the card kept vanishing
 * mid-day instead of holding the top until midnight. The donations therefore come from their own
 * query, and are spliced in here so `splitPinnedDonations` gets to see them.
 *
 * Only donations that would actually be pinned are injected: anything else has a timestamp the
 * page no longer covers, and dropping it into `rest` would park a stale card in the middle of the
 * chronological order. Donations the page still carries are deduplicated by id rather than
 * rendered twice.
 */
export const mergeTodayDonations = <T extends AnyFirebaseLog>(
  logs: T[],
  donations: T[],
  now: Date = new Date(),
): T[] => {
  const dayKey = getPinnedDonationsDayKey(now);
  const alreadyOnPage = new Set(logs.map(logId).filter(Boolean));

  const missing = donations.filter(
    (donation) =>
      isPinnableDonation(donation, dayKey) &&
      !alreadyOnPage.has(logId(donation)),
  );

  return missing.length ? [...missing, ...logs] : logs;
};

/**
 * Splits the feed into the donations pinned to the top and the rest of it. `logs` arrives newest
 * first, so the day's newest donations are the ones that make the cut.
 */
export const splitPinnedDonations = <T extends AnyFirebaseLog>(
  logs: T[],
  now: Date = new Date(),
): PinnedDonationsSplit<T> => {
  const dayKey = getPinnedDonationsDayKey(now);
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
