import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import type { SeatTallies } from "feature/supporterCase/types/supporterCase.types";
import { SLATE_RARITIES } from "feature/supporterCase/types/supporterCase.types";
import { describe, expect, it } from "vitest";

import {
  carryOverSeats,
  combineTallies,
  eligibleItems,
  findItem,
  isEligibleFor,
  isSlateRarity,
  itemKey,
  rankCandidates,
  winnerOf,
} from "./slate";

describe("the slate's shape", () => {
  it("has a seat for every rarity the case can roll, and no others", () => {
    const probabilities = CASE_DEFINITIONS.supporter.probabilities;

    for (const rarity of SLATE_RARITIES) {
      expect(probabilities[rarity]).toBeGreaterThan(0);
    }
    // A seat with no chance of being rolled would be a vote that buys nothing.
    const rollable = Object.entries(probabilities)
      .filter(([, chance]) => (chance ?? 0) > 0)
      .map(([rarity]) => rarity);
    expect([...rollable].sort()).toEqual([...SLATE_RARITIES].sort());
  });

  it("can actually be filled — every seat has items in the game", () => {
    for (const rarity of SLATE_RARITIES) {
      expect(eligibleItems(rarity).length).toBeGreaterThan(0);
    }
  });

  it("seats a Common, which no other case lets anyone aim at", () => {
    expect(SLATE_RARITIES).toContain("Common");
    expect(eligibleItems("Common").length).toBeGreaterThan(0);
  });
});

describe("the balance against the other curated case", () => {
  const supporter = CASE_DEFINITIONS.supporter.probabilities;
  const featured = CASE_DEFINITIONS.daily.probabilities;
  const elite = CASE_DEFINITIONS["elite-guitar"].probabilities;

  it("stays strictly below Elite everywhere it matters", () => {
    // Curation is worth more than odds: a slate has one Mythic where Elite
    // draws from six, so equal odds would make this the better case outright.
    for (const rarity of ["Rare", "Epic", "Legendary", "Mythic"] as const) {
      expect(supporter[rarity]).toBeLessThan(elite[rarity]!);
    }
  });

  it("stays above the Featured case, which is cheaper", () => {
    for (const rarity of ["Rare", "Epic", "Legendary", "Mythic"] as const) {
      expect(supporter[rarity]).toBeGreaterThan(featured[rarity]!);
    }
  });

  it("is priced between the two", () => {
    expect(CASE_DEFINITIONS.supporter.fameCost).toBeGreaterThan(
      CASE_DEFINITIONS.daily.fameCost,
    );
    expect(CASE_DEFINITIONS.supporter.fameCost).toBeLessThan(
      CASE_DEFINITIONS["elite-guitar"].fameCost,
    );
  });

  it("keeps the Common seat thin — that tier is handed out elsewhere", () => {
    // Votable, so the Dex can be finished on purpose, but never enough of the
    // table to make the priciest curated case feel like a Standard.
    expect(supporter.Common).toBeGreaterThan(0);
    expect(supporter.Common).toBeLessThan(featured.Common);
    expect(supporter.Common).toBeLessThan(
      CASE_DEFINITIONS.standard.probabilities.Common,
    );
  });
});

describe("eligibility", () => {
  it("accepts every seat the case can roll, and nothing else", () => {
    expect(isSlateRarity("Common")).toBe(true);
    expect(isSlateRarity("Mythic")).toBe(true);
    expect(isSlateRarity("Custom Shop")).toBe(false);
    expect(isSlateRarity(undefined)).toBe(false);
  });

  it("refuses an item voted into the wrong seat", () => {
    const rare = eligibleItems("Rare")[0];

    expect(isEligibleFor(rare.key, "Rare")).toBe(true);
    expect(isEligibleFor(rare.key, "Mythic")).toBe(false);
  });

  it("refuses a key that names nothing", () => {
    expect(isEligibleFor("guitar:999999", "Rare")).toBe(false);
    expect(isEligibleFor(itemKey("effect", "nope"), "Epic")).toBe(false);
    expect(findItem("guitar:999999")).toBeNull();
  });

  it("resolves a real key back to its item", () => {
    const epic = eligibleItems("Epic")[0];
    const found = findItem(epic.key);

    expect(found?.name).toBe(epic.name);
    expect(found?.rarity).toBe("Epic");
  });
});

describe("winnerOf", () => {
  const seat = "Rare" as const;
  const [first, second] = eligibleItems(seat);

  it("gives the seat to the most backed item", () => {
    expect(winnerOf({ [first.key]: 1, [second.key]: 4 }, seat)).toBe(
      second.key,
    );
  });

  it("breaks a tie the same way every time", () => {
    const tally = { [second.key]: 3, [first.key]: 3 };

    expect(winnerOf(tally, seat)).toBe(first.key);
    // Same tally, keys inserted the other way round — must not change hands.
    expect(winnerOf({ [first.key]: 3, [second.key]: 3 }, seat)).toBe(first.key);
  });

  it("ignores votes for items that do not belong in the seat", () => {
    const mythic = eligibleItems("Mythic")[0];

    expect(winnerOf({ [mythic.key]: 99, [first.key]: 1 }, seat)).toBe(
      first.key,
    );
  });

  it("returns nothing when the seat drew no votes", () => {
    expect(winnerOf({}, seat)).toBeNull();
    expect(winnerOf(undefined, seat)).toBeNull();
    expect(winnerOf({ [first.key]: 0 }, seat)).toBeNull();
  });
});

describe("combineTallies", () => {
  it("adds a carried token to a fresh one on the same item", () => {
    expect(combineTallies({ a: 2 }, { a: 3, b: 1 })).toEqual({ a: 5, b: 1 });
  });

  it("survives a source that is not there", () => {
    expect(combineTallies(undefined, { a: 1 })).toEqual({ a: 1 });
    expect(combineTallies(undefined, undefined)).toEqual({});
  });

  it("drops anything that is not a positive number", () => {
    expect(combineTallies({ a: 0, b: -2, c: Number.NaN })).toEqual({});
  });
});

describe("carryOverSeats", () => {
  const seat = "Rare" as const;
  const [first, second, third] = eligibleItems(seat);

  it("clears the item that took the seat and keeps the rest", () => {
    const carried = carryOverSeats(
      { [seat]: { [first.key]: 5, [second.key]: 3, [third.key]: 1 } },
      { [seat]: first.key },
    );

    expect(carried[seat]).toEqual({ [second.key]: 3, [third.key]: 1 });
  });

  it("hands the next fortnight to whoever came second", () => {
    const carried = carryOverSeats(
      { [seat]: { [first.key]: 5, [second.key]: 3 } },
      { [seat]: first.key },
    );

    expect(winnerOf(carried[seat], seat)).toBe(second.key);
  });

  it("keeps a seat nobody won exactly as it was", () => {
    // No winner means nothing was spent, so nothing clears — a seat that fell
    // to the deterministic draw must not eat the votes it never beat.
    const carried = carryOverSeats(
      { [seat]: { [second.key]: 2 } },
      { [seat]: null },
    );

    expect(carried[seat]).toEqual({ [second.key]: 2 });
  });

  it("carries nothing when the winner was the only thing backed", () => {
    expect(
      carryOverSeats({ [seat]: { [first.key]: 9 } }, { [seat]: first.key }),
    ).toEqual({});
  });

  it("drops items that are no longer in the game", () => {
    const carried = carryOverSeats(
      { [seat]: { [second.key]: 2, "guitar:999999": 40 } },
      { [seat]: first.key },
    );

    expect(carried[seat]).toEqual({ [second.key]: 2 });
  });

  it("ignores tallies that are not positive numbers", () => {
    const carried = carryOverSeats(
      { [seat]: { [second.key]: 0, [third.key]: -4 } },
      { [seat]: first.key },
    );

    expect(carried[seat]).toBeUndefined();
  });

  it("settles each seat on its own winner", () => {
    const mythic = eligibleItems("Mythic")[0];
    const carried = carryOverSeats(
      {
        [seat]: { [first.key]: 2, [second.key]: 1 },
        Mythic: { [mythic.key]: 4 },
      },
      { [seat]: first.key, Mythic: mythic.key },
    );

    expect(carried[seat]).toEqual({ [second.key]: 1 });
    expect(carried.Mythic).toBeUndefined();
  });

  it("lets a losing item win by simply not being abandoned", () => {
    // The winner starts each fortnight from zero while everyone behind it keeps
    // their tokens, so a smaller group that keeps faith outlasts a one-off push
    // instead of paying the same tokens again.
    let ballot: SeatTallies = { [seat]: { [first.key]: 4, [second.key]: 3 } };
    const winners: (string | null)[] = [];

    for (let cycle = 0; cycle < 2; cycle++) {
      const winner = winnerOf(ballot[seat], seat);
      winners.push(winner);
      ballot = carryOverSeats(ballot, { [seat]: winner });
    }

    expect(winners).toEqual([first.key, second.key]);
    // Both were bought in two fortnights, and nothing is left owed.
    expect(ballot).toEqual({});
  });
});

describe("rankCandidates", () => {
  const seat = "Epic" as const;
  const [first, second] = eligibleItems(seat);

  it("lists only what has been backed, most backed first", () => {
    const rows = rankCandidates(
      {
        fresh: { [first.key]: 1, [second.key]: 5 },
        mine: { [second.key]: 2 },
      },
      seat,
    );

    expect(rows.map((row) => row.key)).toEqual([second.key, first.key]);
    expect(rows[0].tokens).toBe(5);
    expect(rows[0].mine).toBe(2);
    expect(rows[1].mine).toBe(0);
  });

  it("counts carried tokens in the total and still shows them apart", () => {
    const rows = rankCandidates(
      {
        fresh: { [first.key]: 1 },
        carried: { [first.key]: 4 },
        mine: { [first.key]: 1 },
        myCarried: { [first.key]: 2 },
      },
      seat,
    );

    expect(rows[0].tokens).toBe(5);
    expect(rows[0].carried).toBe(4);
    expect(rows[0].mine).toBe(3);
  });

  it("ranks an item on its carry-over alone", () => {
    const rows = rankCandidates(
      { fresh: { [second.key]: 2 }, carried: { [first.key]: 6 } },
      seat,
    );

    expect(rows.map((row) => row.key)).toEqual([first.key, second.key]);
    expect(rows[1].carried).toBe(0);
  });

  it("is empty before anyone spends", () => {
    expect(rankCandidates({}, seat)).toEqual([]);
  });
});
