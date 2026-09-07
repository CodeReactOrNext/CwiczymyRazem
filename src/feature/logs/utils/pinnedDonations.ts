import { MAX_DAILY_DONATIONS } from "feature/logs/utils/activityFame";

import {
  type AnyFirebaseLog,
  isFirebaseLogsDonation,
} from "./groupConsecutiveLogs";

/**
 * Recent donations, lifted out of the feed's chronological order and shown first.
 *
 * Money is the rarest thing that happens in the feed and the easiest to scroll past, so for a full
 * day after it lands a coffee sits above the practice reports instead of sinking under them. Only
 * donations matched to an account by email are pinned — an anonymous one has no player to
 * congratulate, so it stays exactly where its timestamp puts it.
 *
 * Past the fourth, a donation drops out of the feed entirely rather than pushing the rest of the
 * activity off the screen; the money is still recorded, it just stops getting its own card.
 */
export interface PinnedDonationsSplit<T extends AnyFirebaseLog> {
  /** Donations inside the pin window, newest first — rendered above everything else. */
  pinned: T[];
  /** Everything else, in the order the feed streamed it. */
  rest: T[];
}

/**
 * How long a donation holds the top of the feed: a full 24 hours from the moment it landed.
 *
 * Deliberately a rolling window rather than "until midnight" — a calendar day would cut a coffee
 * bought late in the evening down to an hour or two on screen, which is exactly what it isn't
 * supposed to do. Every donor gets the same day of visibility, whatever time they gave.
 */
export const PINNED_DONATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Oldest `logs.timestamp` still inside the pin window — the lower bound the donation query needs.
 * Timestamps are stored as ISO strings, so this compares correctly as a plain string.
 */
export const pinnedDonationsSince = (now: Date = new Date()): string =>
  new Date(now.getTime() - PINNED_DONATION_WINDOW_MS).toISOString();

/** When a log happened, in ms. `NaN` for anything missing or malformed — never pinnable. */
const getLogTime = (log: AnyFirebaseLog): number => {
  const raw =
    (log as { timestamp?: string | number | Date; data?: string }).timestamp ??
    (log as { data?: string }).data;

  return new Date(raw as string | number | Date).getTime();
};

/** Whether this log is a donation the feed should pin: matched to an account, and recent enough. */
const isPinnableDonation = (log: AnyFirebaseLog, sinceMs: number): boolean =>
  isFirebaseLogsDonation(log) && Boolean(log.uid) && getLogTime(log) >= sinceMs;

const logId = (log: AnyFirebaseLog): string | undefined =>
  (log as { id?: string }).id;

/**
 * Folds separately-streamed donations back into the feed page.
 *
 * The page is only the newest handful of logs, so a morning coffee scrolls out of it within the
 * hour — and pinning can't lift what was never fetched, which is why the card kept vanishing
 * mid-day instead of holding the top for its full 24 hours. The donations therefore come from
 * their own query, and are spliced in here so `splitPinnedDonations` gets to see them.
 *
 * Only donations that would actually be pinned are injected: anything else has a timestamp the
 * page no longer covers, and dropping it into `rest` would park a stale card in the middle of the
 * chronological order. Donations the page still carries are deduplicated by id rather than
 * rendered twice.
 */
export const mergePinnedDonations = <T extends AnyFirebaseLog>(
  logs: T[],
  donations: T[],
  now: Date = new Date(),
): T[] => {
  const sinceMs = now.getTime() - PINNED_DONATION_WINDOW_MS;
  const alreadyOnPage = new Set(logs.map(logId).filter(Boolean));

  const missing = donations.filter(
    (donation) =>
      isPinnableDonation(donation, sinceMs) &&
      !alreadyOnPage.has(logId(donation)),
  );

  return missing.length ? [...missing, ...logs] : logs;
};

/**
 * Splits the feed into the donations pinned to the top and the rest of it. `logs` arrives newest
 * first, so the newest donations are the ones that make the cut.
 */
export const splitPinnedDonations = <T extends AnyFirebaseLog>(
  logs: T[],
  now: Date = new Date(),
): PinnedDonationsSplit<T> => {
  const sinceMs = now.getTime() - PINNED_DONATION_WINDOW_MS;
  const pinned: T[] = [];
  const rest: T[] = [];

  for (const log of logs) {
    if (!isPinnableDonation(log, sinceMs)) {
      rest.push(log);
      continue;
    }

    if (pinned.length < MAX_DAILY_DONATIONS) pinned.push(log);
  }

  return { pinned, rest };
};
