import type { SupportModalVariant } from "feature/support/components/SupportModal";

const DAY_MS = 86_400_000;

// Give the player real value before the prompt ever comes up (reciprocity).
export const MIN_DAYS_SINCE_REGISTRATION = 3;
export const MIN_SESSIONS = 5;

// The ask comes back a week later at the earliest, however many times it was
// closed before (owner's call: a flat week, no back-off). Dismissals are still
// counted by the hook, so a ladder can come back without losing history.
export const MIN_DAYS_BETWEEN_ASKS = 7;

// A click on the donate button buys a month of quiet: the roster needs time to
// pick the donation up, and asking a fresh donor again is the worst thing this
// modal can do.
export const QUIET_DAYS_AFTER_DONATE_CLICK = 30;

// Supporters hear from the author on their own, slower clock.
export const MIN_DAYS_BETWEEN_SUPPORTER_NOTES = 20;

// A supporter gets this many plain thank-yous, then one note that also points
// at the next goal ("again"), and the cycle starts over.
export const THANKS_BEFORE_AGAIN = 3;

export interface SupportPromptInput {
  now: number;
  accountCreatedMs: number;
  sessionCount: number;
  isSupporter: boolean;
  /**
   * Session count this browser last saw, or null when it has never looked.
   * The prompt only follows a session that was saved since then — it lands in
   * the break after practice, never on the way in.
   */
  seenSessionCount: number | null;
  /** False once the last practice is known to be from another day. */
  practicedToday: boolean;
  lastShownMs: number;
  /** Last click on the ask's donate button, 0 when there was none. */
  lastDonateClickMs: number;
  /** Supporter notes shown so far, thanks and "again" alike. */
  supporterNoteCount: number;
}

const daysSince = (now: number, ms: number) =>
  ms ? (now - ms) / DAY_MS : Infinity;

/**
 * Which support modal, if any, this moment calls for.
 *
 * Non-supporters get the ask, weekly at most.
 * Supporters get a note every few weeks; every fourth is the "again" one
 * instead of a plain thanks.
 */
export const getSupportPrompt = (
  input: SupportPromptInput,
): SupportModalVariant | null => {
  const { now } = input;

  if (input.sessionCount < MIN_SESSIONS) return null;
  if (daysSince(now, input.accountCreatedMs) < MIN_DAYS_SINCE_REGISTRATION) {
    return null;
  }

  const hasFreshSession =
    input.seenSessionCount !== null &&
    input.sessionCount > input.seenSessionCount &&
    input.practicedToday;
  if (!hasFreshSession) return null;

  const daysSinceShown = daysSince(now, input.lastShownMs);

  if (input.isSupporter) {
    // The first note does not wait on an ask shown before they donated.
    const isDue =
      input.supporterNoteCount === 0 ||
      daysSinceShown >= MIN_DAYS_BETWEEN_SUPPORTER_NOTES;
    if (!isDue) return null;

    const isAgainTurn =
      input.supporterNoteCount % (THANKS_BEFORE_AGAIN + 1) ===
      THANKS_BEFORE_AGAIN;
    return isAgainTurn ? "again" : "thanks";
  }

  if (daysSinceShown < MIN_DAYS_BETWEEN_ASKS) return null;
  if (
    daysSince(now, input.lastDonateClickMs) < QUIET_DAYS_AFTER_DONATE_CLICK
  ) {
    return null;
  }

  return "ask";
};
