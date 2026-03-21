import type { CaseDefinition } from "../types/arsenal.types";

export const CASE_DEFINITIONS: Record<string, CaseDefinition> = {
  standard: {
    id: "standard",
    name: "Standard Case",
    description: "A classic case for every aspiring rocker.",
    fameCost: 0,
    probabilities: {
      Common: 0.55,
      Uncommon: 0.25,
      Rare: 0.12,
      Epic: 0.06,
      Legendary: 0.018,
      Mythic: 0.002,
    },
  },
  premium: {
    id: "premium",
    name: "Premium Case",
    description: "Higher odds for the rare and sought-after.",
    fameCost: 0,
    probabilities: {
      Common: 0.30,
      Uncommon: 0.32,
      Rare: 0.22,
      Epic: 0.11,
      Legendary: 0.048,
      Mythic: 0.012,
    },
  },
  elite: {
    id: "elite",
    name: "Elite Case",
    description: "Reserved for the most dedicated players.",
    fameCost: 0,
    probabilities: {
      Common: 0.10,
      Uncommon: 0.20,
      Rare: 0.30,
      Epic: 0.25,
      Legendary: 0.12,
      Mythic: 0.03,
    },
  },
};
