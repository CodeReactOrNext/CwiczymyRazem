import {
  FIVE_DAY_MULTIPLER,
  FOUR_DAY_MULTIPLER,
  THREE_DAY_MULTIPLER,
  TWO_DAY_MULTIPLER,
} from "constants/ratingValue";

export const getDailyStreakMultiplier = (streak: number) => {
  if (streak === 2) return TWO_DAY_MULTIPLER;
  if (streak === 3) return THREE_DAY_MULTIPLER;
  if (streak === 4) return FOUR_DAY_MULTIPLER;
  if (streak >= 5) return FIVE_DAY_MULTIPLER;
  return 0;
};
