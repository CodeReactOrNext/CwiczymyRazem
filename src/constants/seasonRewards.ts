/**
 * Fame paid to the season's top players when the month closes (index = place - 1).
 *
 * These used to top out at 500 for 1st, which put a whole month at the head of
 * the table on level pegging with a *single* challenge recording — and at about
 * a fifth of clearing a full challenge board (3250). A month of leading the
 * season is the longest grind in the app; it now pays like it, at roughly 1.5x a
 * board clear and about one month of an active player's practice income.
 *
 * The ladder also runs ten deep rather than five. The tail is deliberately flat:
 * places 6-10 are a consolation for being in the race, not a reason to fight
 * over 9th. Everything that pays out reads the length of this array, so the
 * ladder can be made longer or shorter here alone.
 */
export const SEASON_FAME_REWARDS = [
  5000, 3000, 2000, 1200, 700, 500, 400, 300, 200, 150,
] as const;

/** How many places the season pays. */
export const SEASON_REWARD_PLACES = SEASON_FAME_REWARDS.length;

/** Fame for a 1-based place, or null for a place outside the ladder. */
export const getSeasonFameReward = (place: number): number | null =>
  SEASON_FAME_REWARDS[place - 1] ?? null;

export const placeSuffix = (place: number): string => {
  if (place === 1) return "st";
  if (place === 2) return "nd";
  if (place === 3) return "rd";
  return "th";
};
