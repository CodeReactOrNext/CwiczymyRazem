/**
 * Fame paid to the season's top players when the month closes (index = place - 1).
 *
 * These used to top out at 500 for 1st, which put a whole month at the head of
 * the table on level pegging with a *single* challenge recording. 1st now pays
 * 2000 — ten recordings, and comfortably above a full challenge board clear
 * (1500), which is an afternoon's work. Leading a season is the longest grind
 * in the app and pays like it, without being the kind of lump sum the economy
 * cannot absorb.
 *
 * The ladder runs ten deep. The tail is deliberately flat: places 6-10 are a
 * consolation for being in the race, not a reason to fight over 9th, and 10th
 * still clears the cheapest case (120) so the row is worth landing. Everything
 * that pays out reads the length of this array, so the ladder can be made
 * longer or shorter here alone.
 */
export const SEASON_FAME_REWARDS = [
  2000, 1200, 800, 500, 350, 250, 220, 200, 175, 150,
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
