import {
  GUILD_BASE_CHALLENGE_TIER,
  sessionsAsked,
} from "feature/guilds/data/guildChallengeTiers";

/**
 * The guild's weekly challenge: a handful of goals, all of them per member.
 *
 * Every target is *per member*, never a flat number. A flat target would make
 * recruiting the whole game: a twenty-strong guild would clear it by Tuesday
 * without anyone trying, while three people practising hard would never get
 * near it. Scaling it means every guild is asked for the same effort from each
 * of its members, which is the only version a small guild can win.
 *
 * What the week asks for is the one thing a guild can buy — see
 * `guildChallengeTiers.ts`; this is what it starts at.
 */
export const SESSIONS_PER_MEMBER = sessionsAsked(GUILD_BASE_CHALLENGE_TIER);

/**
 * A goal is stated to the tenth, because that is what an hour of practice is
 * legibly measured in and floating point sums are not.
 */
const toTenth = (value: number): number =>
  Math.round((Number.isFinite(value) ? value : 0) * 10) / 10;

/**
 * What the whole guild is asked for, from what each member is asked for.
 *
 * The floor is one member's share: a guild nobody has joined yet, or one whose
 * roster failed to read, still has a week in front of it rather than a target
 * of zero it has already cleared.
 */
export const objectiveTarget = (
  memberCount: number,
  perMember: number,
): number => {
  const share = perMember > 0 && Number.isFinite(perMember) ? perMember : 1;
  const roster = Math.max(0, Math.floor(memberCount || 0));
  return toTenth(Math.max(share, share * roster));
};

/**
 * Whether one member has earned this week's Fame.
 *
 * Three things have to be true at once, and the third is the one that matters:
 * the guild has to be on a rank that pays at all, the week has to be cleared,
 * and *this member* has to have done their own share of every goal in it.
 * Without that last clause the reward would pay for standing in a big enough
 * room, which is the exact faucet the challenge was built to avoid — see
 * `guildChallenge.ts`.
 */
export const canClaimReward = (input: {
  reward: number;
  isComplete: boolean;
  /** Whether the member cleared every goal the rank asks of them personally. */
  myShareDone: boolean;
  /** The week already claimed by this member, if any. */
  claimedWeek: string | null;
  thisWeek: string;
}): boolean =>
  input.reward > 0 &&
  input.isComplete &&
  input.myShareDone &&
  input.claimedWeek !== input.thisWeek;

/**
 * The streak after a week is cleared.
 *
 * Consecutive means consecutive: a guild that cleared two weeks ago but missed
 * last week starts again at one. Re-clearing the week already counted leaves
 * the streak alone, so a second read in the same week cannot inflate it.
 */
export const nextStreak = (input: {
  currentStreak: number;
  lastCompletedWeek: string | null;
  thisWeek: string;
  previousWeek: string;
}): number => {
  const { currentStreak, lastCompletedWeek, thisWeek, previousWeek } = input;
  const streak = Math.max(0, Math.floor(currentStreak || 0));

  if (lastCompletedWeek === thisWeek) return streak;
  return lastCompletedWeek === previousWeek ? streak + 1 : 1;
};

/**
 * Whether a stored streak still stands, read from a week that has not been
 * cleared yet. A streak whose last win is older than last week is over — it
 * should read as broken the moment the week rolls, not linger until the guild
 * next plays.
 */
export const streakStillStanding = (input: {
  lastCompletedWeek: string | null;
  thisWeek: string;
  previousWeek: string;
}): boolean =>
  input.lastCompletedWeek === input.thisWeek ||
  input.lastCompletedWeek === input.previousWeek;
