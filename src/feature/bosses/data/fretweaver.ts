import type { BossDefinition } from "../types/boss.types";

/** All 24 orders of four fingers, 1234 first. */
const permutations = (digits: string): string[] =>
  digits.length <= 1
    ? [digits]
    : digits
        .split("")
        .flatMap((d, i) =>
          permutations(digits.slice(0, i) + digits.slice(i + 1)).map(
            (rest) => d + rest,
          ),
        );

export const ALL_FINGER_ORDERS = permutations("1234");

/**
 * The spider boss. One endless fight: every phase it molts into a new form
 * with a freshly dealt drill, faster than the last (see phaseGenerator).
 */
export const FRETWEAVER: BossDefinition = {
  id: "fretweaver",
  name: "The Fretweaver",
  title: "Queen of the chromatic web",
  drill: "spider",
};
