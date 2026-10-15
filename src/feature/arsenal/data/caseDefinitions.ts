import type { CaseDefinition } from "../types/arsenal.types";

/**
 * The shelf.
 *
 * ─── Prices ─────────────────────────────────────────────────────────────────
 *
 * Rebalanced in October 2026, upwards on purpose. The complaint that started it
 * was not that cases were out of reach — Fame income was fine — but that a
 * player could open thirty of them in a sitting and get the same thing back:
 * cheap cases made "open another" the default move, and the top of the shelf was
 * only 2.6 times the bottom, so there was no case worth saving for.
 *
 *   Parts Crate     80   Guitar Builder parts, nothing else
 *   Standard       180   anything can drop
 *   Featured       260   a rotating pool of 10
 *   Premium        350   guitars *or* pedals, Rare and better is the main course
 *   Supporter      420   six items the supporters voted onto the slate
 *   Elite          500   Rare or better, guaranteed
 *   Vault         1200   Epic or better, guaranteed — the case you save for
 *
 * The ladder is what a better case buys: higher odds at every chase tier, a
 * shorter pity counter and no parts. Prices climb faster than the odds do, which
 * is what makes the Vault a decision rather than a default.
 *
 * ─── What a case drops ──────────────────────────────────────────────────────
 *
 * A gear case drops gear, always. Guitar Builder parts used to ride along at 60%
 * on three of the cases, which meant an Elite pull at 370 Fame was a part more
 * often than it was a guitar and the odds on the card described the minority
 * outcome. Parts now come out of the Parts Crate and nowhere else, on a table
 * of their own, so every number printed on a gear card is the number that
 * decides the pull.
 *
 * ─── The odds ───────────────────────────────────────────────────────────────
 *
 * The tables were written to point at the collection they draw from:
 *
 *   rarity      items in game   % of collection
 *   Common           20              15%
 *   Uncommon         26              19%
 *   Rare             29              21%
 *   Epic             35              26%
 *   Legendary        17              13%
 *   Mythic            8               6%
 *
 * They lean toward that split without flattening into it — Mythic at its true
 * share would stop being Mythic. Each case stays strictly better than the one
 * below it at every rarity from Rare up, and cumulatively "Epic or better" is
 * what the test pins for the whole shelf.
 *
 * ─── Pity ───────────────────────────────────────────────────────────────────
 *
 * Every gear case carries a counter, shown on its card (`utils/pity`):
 *
 *   Standard   a model you have never held within 4 opens
 *   Premium    a model you have never held within 3 opens
 *   Elite      a new model within 2 opens, Legendary or better within 8
 *   Vault      Mythic within 10
 *
 * Every number is half of what it first shipped with (7, 6, 5, 15, 20). Odd ones
 * were rounded so that the new-model wait still shortens on every rung of the
 * ladder: 7 became 4, and 5 became 2 rather than a 3 that would have tied Premium.
 *
 * The curated cases (Featured, Supporter) already never repeat while their pool
 * holds something new, and the Parts Crate has no collection to complete, so
 * none of the three carries one.
 */
/**
 * How many cases one pack opens, besides the single open. Paid in Fame one open
 * at a time, never with a free case, and each open counts toward the pity
 * counters. The last open of a pack owes a model the player has never held — or
 * Rare or better when nothing new is in reach — so a pack cannot come back as
 * nothing but repeats.
 */
export const CASE_PACK_SIZES = [5, 10] as const;

export const CASE_DEFINITIONS: Record<string, CaseDefinition> = {
  /**
   * Guitar Builder parts, rolled on the old Standard table. Cheap, because a part
   * is a currency rather than a chase: what it is worth is the level it adds to
   * a build, and that is what the price is for.
   */
  parts: {
    id: "parts",
    name: "Parts Crate",
    description: "Guitar Builder parts only. Never gear.",
    fameCost: 80,
    dropKind: "component",
    yearFrom: 2020,
    yearTo: 2023,
    country: "China",
    probabilities: {
      Common: 0.38,
      Uncommon: 0.28,
      Rare: 0.2,
      Epic: 0.11,
      Legendary: 0.025,
      Mythic: 0.005,
    },
  },
  standard: {
    id: "standard",
    name: "Standard Case",
    description: "A classic case for every aspiring rocker.",
    fameCost: 180,
    yearFrom: 2020,
    yearTo: 2023,
    country: "China",
    probabilities: {
      Common: 0.35,
      Uncommon: 0.28,
      Rare: 0.21,
      Epic: 0.12,
      Legendary: 0.03,
      Mythic: 0.01,
    },
    pity: { newWithin: 4 },
  },
  "premium-guitar": {
    id: "premium-guitar",
    name: "Premium Guitar Case",
    description: "Higher odds for the rare and sought-after.",
    fameCost: 350,
    dropKind: "guitar",
    yearFrom: 2018,
    yearTo: 2023,
    country: "Korea",
    probabilities: {
      Common: 0,
      Uncommon: 0.375,
      Rare: 0.33,
      Epic: 0.23,
      Legendary: 0.05,
      Mythic: 0.015,
    },
    pity: { newWithin: 3 },
  },
  "premium-effect": {
    id: "premium-effect",
    name: "Premium Effects Case",
    description: "Higher odds for the rare and sought-after.",
    fameCost: 350,
    dropKind: "effect",
    yearFrom: 2018,
    yearTo: 2023,
    country: "Korea",
    probabilities: {
      Common: 0,
      Uncommon: 0.375,
      Rare: 0.33,
      Epic: 0.23,
      Legendary: 0.05,
      Mythic: 0.015,
    },
    pity: { newWithin: 3 },
  },
  daily: {
    id: "daily",
    name: "Featured Case",
    description: "A rotating pool of 10 items.",
    fameCost: 260,
    yearFrom: 2018,
    yearTo: 2023,
    country: "Japan",
    probabilities: {
      Common: 0.22,
      Uncommon: 0.25,
      Rare: 0.25,
      Epic: 0.2,
      Legendary: 0.06,
      Mythic: 0.02,
    },
  },
  /**
   * The supporters' own case: six items, one per rarity, voted onto the slate
   * for a fortnight at a time.
   *
   * Balanced as a *targeting* tool, not a better case. Curation is worth far
   * more than it looks: rolling Mythic out of Elite spreads across the Mythics in
   * the game, so a 4% Mythic roll there is well under 1% on the one you wanted,
   * while a slate has exactly one — at equal odds the supporter case would be
   * several times the case Elite is. The odds are therefore set strictly below
   * Elite at every rarity it shares, and strictly above the Featured case, which
   * is the other curated one:
   *
   *   rarity      Featured (260)   Supporter (420)   Elite (500)
   *   Rare            0.25              0.40            0.48
   *   Epic            0.20              0.28            0.38
   *   Legendary       0.06              0.07            0.10
   *   Mythic          0.02             0.025            0.04
   *
   * So the ladder still reads top to bottom on raw value, and what the extra
   * Fame buys over the Featured case is knowing exactly which six items are in it.
   *
   * The Common seat is deliberately thin at 8% — a quarter of what the Standard
   * rolls. Commons are the one tier the game hands out freely, so a fat Common
   * slice on the most expensive curated case would just be a tax; 8% is enough
   * that voting a Common in is a real way to finish that corner of the Dex, and
   * small enough that nobody pays 420 Fame expecting one.
   */
  supporter: {
    id: "supporter",
    name: "Supporter Case",
    description:
      "Six items, chosen by the supporters. New slate every fortnight.",
    fameCost: 420,
    yearFrom: 2018,
    yearTo: 2024,
    country: "USA",
    probabilities: {
      Common: 0.08,
      Uncommon: 0.145,
      Rare: 0.4,
      Epic: 0.28,
      Legendary: 0.07,
      Mythic: 0.025,
    },
  },
  "elite-guitar": {
    id: "elite-guitar",
    name: "Elite Guitar Case",
    description: "Reserved for the most dedicated players.",
    fameCost: 500,
    dropKind: "guitar",
    yearFrom: 2020,
    yearTo: 2023,
    country: "USA",
    probabilities: {
      Common: 0,
      Uncommon: 0,
      Rare: 0.48,
      Epic: 0.38,
      Legendary: 0.1,
      Mythic: 0.04,
    },
    pity: { newWithin: 2, top: { rarity: "Legendary", within: 8 } },
  },
  "elite-effect": {
    id: "elite-effect",
    name: "Elite Effects Case",
    description: "Reserved for the most dedicated players.",
    fameCost: 500,
    dropKind: "effect",
    yearFrom: 2020,
    yearTo: 2023,
    country: "USA",
    probabilities: {
      Common: 0,
      Uncommon: 0,
      Rare: 0.48,
      Epic: 0.38,
      Legendary: 0.1,
      Mythic: 0.04,
    },
    pity: { newWithin: 2, top: { rarity: "Legendary", within: 8 } },
  },
  /**
   * The top of the shelf: no Rare, no Uncommon, no Common — Epic is the floor.
   *
   * Priced to be saved for. At 1200 Fame it is a bit under three Elite cases, and
   * what it trades them for is certainty: every pull is Epic or better, and
   * Mythic is guaranteed within 10 opens.
   *
   * A free case (reward token) cannot open it. A token is worth the same on any
   * shelf it is accepted on, so letting it reach a 1200-Fame case would make it
   * three times the prize it was when the dearest case cost 370.
   *
   * The re-roll ceiling stays at Epic here like everywhere else. Raising it for
   * this one case sounds like the endgame the Vault needs, but it would redirect
   * a collected Epic onto Legendary at the printed 27% share — a player through
   * the Epics would then pull a Legendary on nine opens in ten for 1200 Fame, a
   * cheaper route to one than the Elite case sells. Duplicates are the Vault's
   * endgame, and they now level the copy you own (`data/merge`).
   */
  "vault-guitar": {
    id: "vault-guitar",
    name: "Vault Guitar Case",
    description: "Epic or better, every time.",
    fameCost: 1200,
    dropKind: "guitar",
    noFreeCase: true,
    yearFrom: 2018,
    yearTo: 2024,
    country: "USA",
    probabilities: {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      Epic: 0.65,
      Legendary: 0.27,
      Mythic: 0.08,
    },
    pity: { top: { rarity: "Mythic", within: 10 } },
  },
  "vault-effect": {
    id: "vault-effect",
    name: "Vault Effects Case",
    description: "Epic or better, every time.",
    fameCost: 1200,
    dropKind: "effect",
    noFreeCase: true,
    yearFrom: 2018,
    yearTo: 2024,
    country: "USA",
    probabilities: {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      Epic: 0.65,
      Legendary: 0.27,
      Mythic: 0.08,
    },
    pity: { top: { rarity: "Mythic", within: 10 } },
  },
};
