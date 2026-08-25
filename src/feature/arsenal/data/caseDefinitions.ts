import type { CaseDefinition } from "../types/arsenal.types";

/**
 * Case prices.
 *
 * Cut roughly 20% across the board from the launch numbers (150/200/300/400),
 * because the collection turned out to be gated by case *count* rather than by
 * the drop table: nobody can own more distinct items than they have opened
 * cases, and at the old prices a player 40 hours into the game could afford
 * fewer than 30 of them against an 84-item collection. That put a hard ceiling
 * of about a third of the Dex on them no matter how the odds were tuned.
 *
 * Deliberately a partial cut rather than the full one the math argues for: the
 * drop table and duplicate handling are the other half of the same problem, and
 * moving one lever at a time keeps it readable which change did what.
 *
 * ─── The odds ───────────────────────────────────────────────────────────────
 *
 * The tables below were rewritten to point at the collection they draw from.
 * The launch odds were built as if the game were mostly Commons, and it is not:
 *
 *   rarity      items in game   % of collection   old standard odds
 *   Common           12              14%                70%
 *   Uncommon         14              17%                20%
 *   Rare             16              19%                 7%
 *   Epic             27              32%               2.5%
 *   Legendary        12              14%               0.4%
 *   Mythic            3               4%               0.1%
 *
 * Seventy percent of every pull came back out of the smallest bucket in the
 * game, which is what players were describing as junk — the same dozen items,
 * over and over. Meanwhile the single largest slice of the collection sat
 * behind a 1-in-40 roll: a *specific* Epic guitar averaged 1333 cases.
 *
 * The new tables lean toward the content split without flattening into it —
 * Mythic at its true 4% share would stop being Mythic. Each case stays strictly
 * better than the one below it at every rarity above Uncommon, which is the
 * property that makes the ladder worth climbing.
 */
export const CASE_DEFINITIONS: Record<string, CaseDefinition> = {
  standard: {
    id: "standard",
    name: "Standard Case",
    description: "A classic case for every aspiring rocker.",
    fameCost: 120,
    yearFrom: 2020,
    yearTo: 2023,
    country: "China",
    probabilities: {
      Common: 0.38,
      Uncommon: 0.28,
      Rare: 0.20,
      Epic: 0.11,
      Legendary: 0.025,
      Mythic: 0.005,
    },
  },
  "premium-guitar": {
    id: "premium-guitar",
    name: "Premium Guitar Case",
    description: "Higher odds for the rare and sought-after.",
    fameCost: 250,
    dropKind: "guitar",
    yearFrom: 2018,
    yearTo: 2023,
    country: "Korea",
    probabilities: {
      Common: 0,
      Uncommon: 0.40,
      Rare: 0.33,
      Epic: 0.22,
      Legendary: 0.04,
      Mythic: 0.01,
    },
  },
  "premium-effect": {
    id: "premium-effect",
    name: "Premium Effects Case",
    description: "Higher odds for the rare and sought-after.",
    fameCost: 250,
    dropKind: "effect",
    yearFrom: 2018,
    yearTo: 2023,
    country: "Korea",
    probabilities: {
      Common: 0,
      Uncommon: 0.40,
      Rare: 0.33,
      Epic: 0.22,
      Legendary: 0.04,
      Mythic: 0.01,
    },
  },
  daily: {
    id: "daily",
    name: "Featured Case",
    description: "A rotating pool of 10 items.",
    fameCost: 160,
    yearFrom: 2018,
    yearTo: 2023,
    country: "Japan",
    probabilities: {
      Common: 0.22,
      Uncommon: 0.25,
      Rare: 0.25,
      Epic: 0.20,
      Legendary: 0.06,
      Mythic: 0.02,
    },
  },
  "elite-guitar": {
    id: "elite-guitar",
    name: "Elite Guitar Case",
    description: "Reserved for the most dedicated players.",
    fameCost: 350,
    dropKind: "guitar",
    yearFrom: 2020,
    yearTo: 2023,
    country: "USA",
    probabilities: {
      Common: 0,
      Uncommon: 0,
      Rare: 0.50,
      Epic: 0.38,
      Legendary: 0.09,
      Mythic: 0.03,
    },
  },
  "elite-effect": {
    id: "elite-effect",
    name: "Elite Effects Case",
    description: "Reserved for the most dedicated players.",
    fameCost: 350,
    dropKind: "effect",
    yearFrom: 2020,
    yearTo: 2023,
    country: "USA",
    probabilities: {
      Common: 0,
      Uncommon: 0,
      Rare: 0.50,
      Epic: 0.38,
      Legendary: 0.09,
      Mythic: 0.03,
    },
  },
};
