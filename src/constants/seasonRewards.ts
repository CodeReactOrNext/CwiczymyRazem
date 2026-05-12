// Fame points awarded to top 5 players at season end (index = place - 1)
export const SEASON_FAME_REWARDS = [500, 300, 200, 100, 50] as const;

export const placeSuffix = (place: number): string => {
  if (place === 1) return "st";
  if (place === 2) return "nd";
  if (place === 3) return "rd";
  return "th";
};
