/**
 * Challenge ids are month buckets (`YYYY-MM`) computed in UTC so the client and
 * the Admin-SDK rollover route always agree on which board is live, regardless
 * of the player's timezone.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, "0");

export const toChallengeId = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;

export const currentChallengeId = (now: Date = new Date()): string =>
  toChallengeId(now);

/** Parses `YYYY-MM` into its numeric parts; throws on anything else. */
const parseChallengeId = (
  challengeId: string,
): { year: number; month: number } => {
  const match = /^(\d{4})-(\d{2})$/.exec(challengeId);
  if (!match) throw new Error(`Invalid challenge id: ${challengeId}`);
  const month = Number(match[2]);
  if (month < 1 || month > 12)
    throw new Error(`Invalid challenge id: ${challengeId}`);
  return { year: Number(match[1]), month };
};

/** Moves a challenge id by whole months — negative goes back. */
export const shiftChallengeId = (
  challengeId: string,
  months: number,
): string => {
  const { year, month } = parseChallengeId(challengeId);
  return toChallengeId(new Date(Date.UTC(year, month - 1 + months, 1)));
};

/** The month currently open for nominations — always the one after the live board. */
export const votingChallengeId = (now: Date = new Date()): string =>
  shiftChallengeId(currentChallengeId(now), 1);

/** First and last instant of a challenge month, in UTC. */
export const challengeWindow = (
  challengeId: string,
): { startsAt: Date; endsAt: Date } => {
  const { year, month } = parseChallengeId(challengeId);
  return {
    startsAt: new Date(Date.UTC(year, month - 1, 1)),
    endsAt: new Date(Date.UTC(year, month, 1) - 1),
  };
};

export const challengeMonthLabel = (challengeId: string): string => {
  const { startsAt } = challengeWindow(challengeId);
  return startsAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

/** Whole days left before the board closes — 0 once the month is over. */
export const daysLeftInChallenge = (
  challengeId: string,
  now: Date = new Date(),
): number => {
  const { endsAt } = challengeWindow(challengeId);
  return Math.max(
    0,
    Math.ceil((endsAt.getTime() - now.getTime()) / MS_PER_DAY),
  );
};

export const isChallengeLive = (
  challengeId: string,
  now: Date = new Date(),
): boolean => currentChallengeId(now) === challengeId;
