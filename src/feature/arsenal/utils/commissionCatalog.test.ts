import { describe, expect, it } from "vitest";

import { EFFECT_DEFINITIONS } from "../data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "../data/guitarDefinitions";
import { RARITY_LADDER } from "../data/itemStats";
import { isTrophyGuitar } from "../data/trophyGuitars";
import type { ArsenalUserData } from "../types/arsenal.types";
import { getCommissionCatalog } from "./commissionCatalog";

const account = (overrides: Partial<ArsenalUserData> = {}) => ({
  inventory: [],
  effectInventory: [],
  dexGuitars: [],
  dexEffects: [],
  ...overrides,
});

const NON_TROPHY_GUITARS = GUITAR_DEFINITIONS.filter(
  (g) => !isTrophyGuitar(g.id),
);

describe("getCommissionCatalog", () => {
  it("lists every pedal and every guitar but the roadmap trophies on a fresh account", () => {
    const catalog = getCommissionCatalog(account());
    expect(catalog).toHaveLength(
      NON_TROPHY_GUITARS.length + EFFECT_DEFINITIONS.length,
    );
    expect(
      catalog.some(
        ({ target }) =>
          target.kind === "guitar" && isTrophyGuitar(target.def.id),
      ),
    ).toBe(false);
  });

  it("drops what the Dex records and what sits in the stash", () => {
    const recorded = NON_TROPHY_GUITARS[0];
    const held = NON_TROPHY_GUITARS[1];
    const pedal = EFFECT_DEFINITIONS[0];
    const catalog = getCommissionCatalog(
      account({
        dexGuitars: [recorded.id],
        inventory: [{ guitarId: held.id } as ArsenalUserData["inventory"][0]],
        dexEffects: [pedal.id],
      }),
    );
    const keys = catalog.map((e) => e.key);

    expect(keys).not.toContain(`guitar-${recorded.id}`);
    expect(keys).not.toContain(`guitar-${held.id}`);
    expect(keys).not.toContain(`effect-${pedal.id}`);
    expect(catalog).toHaveLength(
      NON_TROPHY_GUITARS.length + EFFECT_DEFINITIONS.length - 3,
    );
  });

  it("puts the rarest first and keeps the catalogue order inside a rarity", () => {
    const catalog = getCommissionCatalog(account());
    const ranks = catalog.map(({ target }) =>
      RARITY_LADDER.indexOf(target.def.rarity),
    );
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));

    const mythicGuitars = catalog
      .filter(
        ({ target }) =>
          target.kind === "guitar" && target.def.rarity === "Mythic",
      )
      .map(({ target }) => target.def.id);
    expect(mythicGuitars).toEqual(
      NON_TROPHY_GUITARS.filter((g) => g.rarity === "Mythic").map((g) => g.id),
    );
  });

  it("is empty once the Dex holds everything the bench builds", () => {
    expect(
      getCommissionCatalog(
        account({
          dexGuitars: GUITAR_DEFINITIONS.map((g) => g.id),
          dexEffects: EFFECT_DEFINITIONS.map((e) => e.id),
        }),
      ),
    ).toEqual([]);
  });
});
