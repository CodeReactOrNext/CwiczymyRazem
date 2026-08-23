export const HABBITS_POINTS_VALUE = 1;
// 22 points per practised hour: 3_600_000 ms * 0.00000612 = 22.03, so a full
// hour lands on 22 after the floor in `makeRatingData` (the previous 0.00000556
// was picked the same way for 20/h). Raised so logged practice time carries more
// of the season score relative to the flat, one-off rewards.
export const TIME_POINTS_VALUE = 0.00000612;
export const TWO_DAY_MULTIPLER = 0.2;
export const THREE_DAY_MULTIPLER = 0.3;
export const FOUR_DAY_MULTIPLER = 0.4;
export const FIVE_DAY_MULTIPLER = 0.5;
