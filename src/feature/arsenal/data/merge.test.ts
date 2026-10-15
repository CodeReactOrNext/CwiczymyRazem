import { describe, expect, it } from "vitest";

import type {
  EffectInventoryItem,
  GuitarRarity,
  InventoryItem,
} from "../types/arsenal.types";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { getEffectLevel } from "./effectStats";
import { DROPPABLE_GUITARS } from "./guitarDefinitions";
import { getItemLevel, getItemValue, RARITY_BUILD_GAIN } from "./itemStats";
import {
  canMergeAway,
  EFFECT_MERGE,
  getMergeGain,
  getMergeOffer,
  MERGE_GAIN_MULTIPLIER,
  getMergeState,
  GUITAR_MERGE,
  planMerge,
} from "./merge";

const guitar = DROPPABLE_GUITARS.find((g) => g.rarity === "Epic")!;
const otherGuitar = DROPPABLE_GUITARS.find(
  (g) => g.rarity === "Epic" && g.id !== guitar.id,
)!;

const copy = (
  id: string,
  extra: Partial<InventoryItem> = {},
): InventoryItem => ({
  id,
  guitarId: guitar.id,
  acquiredAt: 1,
  isNew: false,
  year: guitar.yearTo,
  country: guitar.countries[0],
  condition: 0.5,
  ...extra,
});

describe("getMergeGain", () => {
  it("is the multiplier times the level one workshop build of the model is worth", () => {
    for (const rarity of Object.keys(RARITY_BUILD_GAIN) as GuitarRarity[]) {
      expect(getMergeGain(rarity)).toBe(
        RARITY_BUILD_GAIN[rarity] * MERGE_GAIN_MULTIPLIER,
      );
    }
  });

  it("climbs with rarity", () => {
    expect(getMergeGain("Common")).toBe(3);
    expect(getMergeGain("Uncommon")).toBe(3);
    expect(getMergeGain("Rare")).toBe(6);
    expect(getMergeGain("Epic")).toBe(6);
    expect(getMergeGain("Legendary")).toBe(9);
    expect(getMergeGain("Mythic")).toBe(12);
  });

  it("is a multiplier of three, which is what the wiki tells players", () => {
    expect(MERGE_GAIN_MULTIPLIER).toBe(3);
  });
});

describe("canMergeAway", () => {
  it("accepts a plain copy", () => {
    expect(canMergeAway(copy("a"))).toBe(true);
  });

  it("refuses anything the player has paid to improve", () => {
    expect(canMergeAway(copy("a", { buildLevel: 1 }))).toBe(false);
    expect(canMergeAway(copy("a", { mergeBonus: 2 }))).toBe(false);
  });

  it("refuses a Guitar Builder guitar", () => {
    expect(
      canMergeAway(
        copy("a", {
          custom: { level: 20 } as unknown as InventoryItem["custom"],
        }),
      ),
    ).toBe(false);
  });
});

describe("item level", () => {
  it("adds merged points on top, with no ceiling", () => {
    const base = getItemLevel(copy("a"), guitar);
    expect(getItemLevel(copy("a", { mergeBonus: 6 }), guitar)).toBe(base + 6);
    expect(getItemLevel(copy("a", { mergeBonus: 600 }), guitar)).toBe(
      base + 600,
    );
  });

  it("does the same for pedals", () => {
    const effect = EFFECT_DEFINITIONS[0];
    const pedal: EffectInventoryItem = {
      id: "p",
      effectId: effect.id,
      acquiredAt: 1,
      isNew: false,
      year: effect.yearTo,
      country: effect.countries?.[0],
      condition: 0.5,
    };
    expect(getEffectLevel({ ...pedal, mergeBonus: 8 }, effect)).toBe(
      getEffectLevel(pedal, effect) + 8,
    );
  });

  it("leaves sell value alone, so merging cannot print Fame", () => {
    expect(getItemValue(copy("a", { mergeBonus: 40 }), guitar)).toBe(
      getItemValue(copy("a"), guitar),
    );
  });
});

describe("getMergeOffer", () => {
  it("lands on the highest-level copy of the same model", () => {
    const low = copy("low", { condition: 0.1 });
    const high = copy("high", { condition: 0.95, mergeBonus: 4 });
    const dupe = copy("dupe");
    const offer = getMergeOffer([low, high, dupe], "dupe", GUITAR_MERGE)!;

    expect(offer.targetId).toBe("high");
    expect(offer.gain).toBe(getMergeGain(guitar.rarity));
    expect(offer.levelAfter).toBe(offer.levelBefore + offer.gain);
  });

  it("has nothing to offer when the duplicate is the only copy", () => {
    expect(getMergeOffer([copy("only")], "only", GUITAR_MERGE)).toBeNull();
  });

  it("never lands on a different model", () => {
    const stranger = copy("stranger", { guitarId: otherGuitar.id });
    expect(
      getMergeOffer([stranger, copy("dupe")], "dupe", GUITAR_MERGE),
    ).toBeNull();
  });

  it("offers nothing for a copy that must not be folded away", () => {
    const built = copy("built", { buildLevel: 2 });
    expect(
      getMergeOffer([copy("keep"), built], "built", GUITAR_MERGE),
    ).toBeNull();
  });

  it("offers nothing for a copy in service", () => {
    const offer = getMergeOffer(
      [copy("keep"), copy("worn")],
      "worn",
      GUITAR_MERGE,
      new Set(["worn"]),
    );
    expect(offer).toBeNull();
  });
});

describe("planMerge", () => {
  it("folds the duplicate into the best copy and drops it from the stash", () => {
    const plan = planMerge(
      [copy("keep"), copy("dupe")],
      ["dupe"],
      GUITAR_MERGE,
    );

    expect(plan.merged).toBe(1);
    expect(plan.items.map((i) => i.id)).toEqual(["keep"]);
    expect(plan.items[0]).toMatchObject({
      mergeBonus: getMergeGain(guitar.rarity),
      mergeCount: 1,
    });
    expect(plan.gain).toBe(getMergeGain(guitar.rarity));
    expect(plan.raised.map((i) => i.id)).toEqual(["keep"]);
  });

  it("stacks without limit as more duplicates come in", () => {
    const ids = ["d1", "d2", "d3", "d4", "d5"];
    const plan = planMerge(
      [copy("keep"), ...ids.map((id) => copy(id))],
      ids,
      GUITAR_MERGE,
    );

    expect(plan.merged).toBe(5);
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].mergeBonus).toBe(5 * getMergeGain(guitar.rarity));
    expect(plan.items[0].mergeCount).toBe(5);
  });

  it("never consumes every copy: sources are not targets", () => {
    // Asking to merge two copies into each other must not delete both.
    const plan = planMerge([copy("a"), copy("b")], ["a", "b"], GUITAR_MERGE);

    expect(plan.merged).toBe(0);
    expect(plan.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect([...plan.skipped].sort()).toEqual(["a", "b"]);
  });

  it("leaves a blocked copy where it is", () => {
    const plan = planMerge(
      [copy("keep"), copy("worn")],
      ["worn"],
      GUITAR_MERGE,
      new Set(["worn"]),
    );

    expect(plan.merged).toBe(0);
    expect(plan.items).toHaveLength(2);
    expect(plan.skipped).toEqual(["worn"]);
  });

  it("skips an id that is not in the stash", () => {
    const plan = planMerge([copy("keep")], ["ghost"], GUITAR_MERGE);
    expect(plan.merged).toBe(0);
    expect(plan.skipped).toEqual(["ghost"]);
  });

  it("folds each model into its own best copy", () => {
    const stash = [
      copy("a-keep"),
      copy("b-keep", { guitarId: otherGuitar.id }),
      copy("a-dupe"),
      copy("b-dupe", { guitarId: otherGuitar.id }),
    ];
    const plan = planMerge(stash, ["a-dupe", "b-dupe"], GUITAR_MERGE);

    expect(plan.merged).toBe(2);
    expect(plan.items.map((i) => i.id).sort()).toEqual(["a-keep", "b-keep"]);
    for (const item of plan.items) expect(item.mergeCount).toBe(1);
  });

  it("works on pedals the same way", () => {
    const effect = EFFECT_DEFINITIONS[0];
    const pedal = (id: string): EffectInventoryItem => ({
      id,
      effectId: effect.id,
      acquiredAt: 1,
      isNew: false,
    });
    const plan = planMerge(
      [pedal("keep"), pedal("dupe")],
      ["dupe"],
      EFFECT_MERGE,
    );

    expect(plan.merged).toBe(1);
    expect(plan.items[0].mergeBonus).toBe(getMergeGain(effect.rarity));
  });
});

describe("getMergeState", () => {
  // Three copies, weakest to strongest, so every rule has something to bite on.
  const weak = copy("weak", { condition: 0.1 });
  const mid = copy("mid", { condition: 0.5 });
  const strong = copy("strong", { condition: 0.95 });
  const stash = [weak, mid, strong];

  it("shows nothing for a model held only once", () => {
    expect(getMergeState([copy("only")], "only", GUITAR_MERGE)).toBeNull();
  });

  it("shows nothing for an id that is not in the stash", () => {
    expect(getMergeState(stash, "ghost", GUITAR_MERGE)).toBeNull();
  });

  it("offers a weaker copy the merge into the strongest", () => {
    const state = getMergeState(stash, "weak", GUITAR_MERGE)!;

    expect(state.blocked).toBeUndefined();
    expect(state.offer?.targetId).toBe("strong");
    expect(state.offer?.gain).toBe(getMergeGain(guitar.rarity));
  });

  it("blocks the strongest copy — it is what the others fold into", () => {
    expect(getMergeState(stash, "strong", GUITAR_MERGE)).toEqual({
      offer: null,
      blocked: "best",
    });
  });

  it("blocks a copy carrying workshop levels or an earlier merge", () => {
    const built = [weak, copy("built", { buildLevel: 1 })];
    expect(getMergeState(built, "built", GUITAR_MERGE)?.blocked).toBe("built");

    const merged = [weak, copy("merged", { mergeBonus: 2 })];
    expect(getMergeState(merged, "merged", GUITAR_MERGE)?.blocked).toBe(
      "built",
    );
  });

  it("blocks a copy in service and names that as the reason", () => {
    const state = getMergeState(stash, "mid", GUITAR_MERGE, new Set(["mid"]));
    expect(state).toEqual({ offer: null, blocked: "in-use" });
  });

  it("puts the rule about work lost ahead of the one about use", () => {
    // A built copy that is also in service: the loss is the bigger news.
    const built = [weak, copy("built", { buildLevel: 2 })];
    expect(
      getMergeState(built, "built", GUITAR_MERGE, new Set(["built"]))?.blocked,
    ).toBe("built");
  });

  it("lets a copy in service be the one that receives the merge", () => {
    // The strongest copy is on the profile. Being in use stops a copy being
    // folded *away*; it is exactly the copy a spare should be folded *into*.
    const state = getMergeState(
      stash,
      "weak",
      GUITAR_MERGE,
      new Set(["strong"]),
    );
    expect(state?.offer?.targetId).toBe("strong");
  });
});
