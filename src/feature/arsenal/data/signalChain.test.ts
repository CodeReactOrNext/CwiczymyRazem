import { describe, expect, it } from "vitest";

import type { EffectType } from "../types/arsenal.types";
import { ROW_Y_PCT } from "../utils/pedalboardLayout";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import {
  CHAIN_FLAWLESS_FAME,
  CHAIN_FLAWLESS_MIN_PEDALS,
  CHAIN_LINK_FAME,
  CHAIN_TIERS,
  evaluateChain,
  getChainFameRate,
  PLAYABLE_SIGNAL_STAGES,
  readChainNodes,
  SIGNAL_STAGES,
  stageIndexOf,
  wiredOrder,
} from "./signalChain";

/** Every effect type in the game, so coverage can be asserted rather than assumed. */
const ALL_TYPES: EffectType[] = [
  "Overdrive",
  "Distortion",
  "Delay",
  "Reverb",
  "Chorus",
  "Wah",
  "Compressor",
  "EQ",
  "Fuzz",
  "Phaser",
  "Flanger",
  "Boost",
  "Vibrato",
  "Tuner",
];

const firstEffectOfType = (type: EffectType) => {
  const def = EFFECT_DEFINITIONS.find((d) => d.type === type);
  if (!def) throw new Error(`no pedal of type ${type} in the game`);
  return def;
};

/**
 * Builds a board out of effect types, laid right to left along the top row —
 * so the array order is the signal order.
 */
const board = (types: EffectType[]) => {
  const effectInventory = types.map((type, index) => ({
    id: `item-${index}`,
    effectId: firstEffectOfType(type).id,
    acquiredAt: 0,
    isNew: false,
  }));
  const items = types.map((_, index) => ({
    itemId: `item-${index}`,
    xPct: 87 - index * 10,
    yPct: ROW_Y_PCT[0],
  }));
  return { items, effectInventory };
};

const verdictFor = (types: EffectType[]) => {
  const { items, effectInventory } = board(types);
  return evaluateChain(readChainNodes(items, effectInventory));
};

describe("SIGNAL_STAGES", () => {
  it("gives every effect type in the game exactly one stage", () => {
    for (const type of ALL_TYPES) {
      expect(stageIndexOf(type), type).toBeGreaterThanOrEqual(0);
    }

    const seen = new Set<EffectType>();
    for (const stage of SIGNAL_STAGES) {
      for (const type of stage.types) {
        expect(seen.has(type), `${type} appears in two stages`).toBe(false);
        seen.add(type);
      }
    }
    expect(seen.size).toBe(ALL_TYPES.length);
  });

  it("puts the tuner first and the reverb last", () => {
    expect(stageIndexOf("Tuner")).toBe(0);
    expect(stageIndexOf("Reverb")).toBe(SIGNAL_STAGES.length - 1);
  });

  it("keeps the modulation family on one stage — order there is taste", () => {
    const modulation = stageIndexOf("Chorus");
    for (const type of ["Phaser", "Flanger", "Vibrato"] as EffectType[]) {
      expect(stageIndexOf(type), type).toBe(modulation);
    }
  });

  it("orders dirt, then what shapes it, then the time effects", () => {
    expect(stageIndexOf("Fuzz")).toBeLessThan(stageIndexOf("Overdrive"));
    expect(stageIndexOf("Overdrive")).toBeLessThan(stageIndexOf("Distortion"));
    expect(stageIndexOf("Distortion")).toBeLessThan(stageIndexOf("Boost"));
    expect(stageIndexOf("Boost")).toBeLessThan(stageIndexOf("EQ"));
    expect(stageIndexOf("EQ")).toBeLessThan(stageIndexOf("Chorus"));
    expect(stageIndexOf("Chorus")).toBeLessThan(stageIndexOf("Delay"));
    expect(stageIndexOf("Delay")).toBeLessThan(stageIndexOf("Reverb"));
  });

  it("only offers the ladder stages a player can actually fill today", () => {
    for (const stage of PLAYABLE_SIGNAL_STAGES) {
      expect(
        stage.types.some((type) =>
          EFFECT_DEFINITIONS.some((def) => def.type === type),
        ),
        stage.id,
      ).toBe(true);
    }
    expect(PLAYABLE_SIGNAL_STAGES.length).toBeGreaterThan(0);
    expect(PLAYABLE_SIGNAL_STAGES.length).toBeLessThanOrEqual(
      SIGNAL_STAGES.length,
    );
  });

  it("names and describes every tier", () => {
    for (const tier of Object.values(CHAIN_TIERS)) {
      expect(tier.label.length).toBeGreaterThan(0);
      expect(tier.note.length).toBeGreaterThan(0);
    }
  });
});

describe("readChainNodes", () => {
  it("reads the top row before the bottom one, each right to left", () => {
    const effectInventory = [
      { id: "a", effectId: firstEffectOfType("Tuner").id, acquiredAt: 0, isNew: false },
      { id: "b", effectId: firstEffectOfType("Delay").id, acquiredAt: 0, isNew: false },
      { id: "c", effectId: firstEffectOfType("Reverb").id, acquiredAt: 0, isNew: false },
    ];
    // Stored in the wrong order on purpose: position decides the chain, not the array.
    const items = [
      { itemId: "c", xPct: 40, yPct: ROW_Y_PCT[1] },
      { itemId: "b", xPct: 20, yPct: ROW_Y_PCT[0] },
      { itemId: "a", xPct: 80, yPct: ROW_Y_PCT[0] },
    ];

    expect(readChainNodes(items, effectInventory).map((n) => n.itemId)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("skips a pedal whose definition no longer exists", () => {
    const nodes = readChainNodes(
      [{ itemId: "ghost", xPct: 5, yPct: ROW_Y_PCT[0] }],
      [{ id: "ghost", effectId: "retired-effect", acquiredAt: 0, isNew: false }],
    );
    expect(nodes).toEqual([]);
  });

  it("survives a missing board and a missing inventory", () => {
    expect(readChainNodes(undefined, undefined)).toEqual([]);
    expect(readChainNodes(null, [])).toEqual([]);
  });
});

describe("evaluateChain", () => {
  it("pays nothing for an empty board", () => {
    const verdict = verdictFor([]);
    expect(verdict.rate).toBe(0);
    expect(verdict.tier).toBe("empty");
    expect(verdict.tip).toBeNull();
  });

  it("does not judge a single pedal", () => {
    const verdict = verdictFor(["Reverb"]);
    expect(verdict.tier).toBe("single");
    expect(verdict.links).toEqual([]);
    expect(verdict.rate).toBe(0);
  });

  it("pays every cable plus the flawless bonus on a by-the-book board", () => {
    const verdict = verdictFor([
      "Tuner",
      "Fuzz",
      "Overdrive",
      "Boost",
      "EQ",
      "Chorus",
      "Delay",
      "Reverb",
    ]);

    expect(verdict.tier).toBe("book");
    expect(verdict.wrongLinks).toBe(0);
    expect(verdict.flawless).toBe(true);
    expect(verdict.okLinks).toBe(7);
    expect(verdict.rate).toBe(7 * CHAIN_LINK_FAME + CHAIN_FLAWLESS_FAME);
    expect(verdict.tip).toBeNull();
  });

  it("withholds the flawless bonus until the board is a real chain", () => {
    const two = verdictFor(["Overdrive", "Delay"]);
    expect(two.nodes.length).toBeLessThan(CHAIN_FLAWLESS_MIN_PEDALS);
    expect(two.tier).toBe("book");
    expect(two.flawless).toBe(false);
    expect(two.rate).toBe(CHAIN_LINK_FAME);
  });

  it("accepts two pedals of the same type in either order", () => {
    const verdict = verdictFor(["Overdrive", "Overdrive", "Delay"]);
    expect(verdict.wrongLinks).toBe(0);
    expect(verdict.flawless).toBe(true);
  });

  it("accepts any arrangement inside the modulation family", () => {
    const verdict = verdictFor(["Chorus", "Vibrato", "Phaser", "Delay"]);
    expect(verdict.wrongLinks).toBe(0);
  });

  it("blames exactly the cable that runs backwards", () => {
    const verdict = verdictFor(["Reverb", "Overdrive", "Delay"]);

    expect(verdict.wrongLinks).toBe(1);
    expect(verdict.okLinks).toBe(1);
    expect(verdict.tier).toBe("one-off");
    expect(verdict.links.map((l) => l.ok)).toEqual([false, true]);
    expect(verdict.rate).toBe(CHAIN_LINK_FAME);
  });

  it("names both pedals and both stages in the tip", () => {
    const verdict = verdictFor(["Delay", "Tuner"]);
    expect(verdict.tip).toContain(firstEffectOfType("Tuner").name);
    expect(verdict.tip).toContain(firstEffectOfType("Delay").name);
    expect(verdict.tip).toContain("Tuner comes before Delay");
  });

  it("pays more for every cable put right", () => {
    const rates = [
      verdictFor(["Reverb", "Delay", "Overdrive", "Tuner"]).rate,
      verdictFor(["Reverb", "Delay", "Tuner", "Overdrive"]).rate,
      verdictFor(["Reverb", "Tuner", "Overdrive", "Delay"]).rate,
      verdictFor(["Tuner", "Overdrive", "Delay", "Reverb"]).rate,
    ];

    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1]);
    }
  });

  it("climbs the tiers as the wiring gets worse", () => {
    expect(verdictFor(["Tuner", "Overdrive", "Delay", "Reverb"]).tier).toBe("book");
    expect(verdictFor(["Overdrive", "Tuner", "Delay", "Reverb"]).tier).toBe("one-off");
    expect(verdictFor(["Overdrive", "Tuner", "Reverb", "Delay"]).tier).toBe("rough");
    expect(verdictFor(["Reverb", "Delay", "Overdrive", "Tuner"]).tier).toBe("spaghetti");
  });

  it("reports the stages the board covers, without repeats", () => {
    const verdict = verdictFor(["Overdrive", "Overdrive", "Delay"]);
    expect(verdict.filledStages).toEqual([
      stageIndexOf("Overdrive"),
      stageIndexOf("Delay"),
    ]);
  });
});

describe("getChainFameRate", () => {
  it("scores a stored arsenal the way the board does", () => {
    const { items, effectInventory } = board(["Tuner", "Overdrive", "Delay"]);
    const arsenal = {
      rig: { guitarSlots: [null, null, null] as [null, null, null], pedalboardItems: items, ampHeadId: null, ampId: null },
      effectInventory,
    };

    expect(getChainFameRate(arsenal)).toBe(
      2 * CHAIN_LINK_FAME + CHAIN_FLAWLESS_FAME,
    );
  });

  it("pays nothing for a player with no arsenal at all", () => {
    expect(getChainFameRate(null)).toBe(0);
    expect(getChainFameRate({})).toBe(0);
  });
});

describe("wiredOrder", () => {
  it("turns any board into a by-the-book one", () => {
    const { items, effectInventory } = board([
      "Reverb",
      "Delay",
      "Chorus",
      "Overdrive",
      "Fuzz",
      "Tuner",
    ]);

    const wired = wiredOrder(items, effectInventory);
    // Re-laid right to left in the returned order, the chain is flawless.
    const relaid = wired.map((item, index) => ({
      ...item,
      xPct: 87 - index * 10,
      yPct: ROW_Y_PCT[0],
    }));

    const verdict = evaluateChain(readChainNodes(relaid, effectInventory));
    expect(verdict.wrongLinks).toBe(0);
    expect(verdict.flawless).toBe(true);
  });

  it("leaves pedals sharing a stage in the order the player left them", () => {
    const { items, effectInventory } = board([
      "Overdrive",
      "Chorus",
      "Vibrato",
      "Phaser",
    ]);

    const wired = wiredOrder(items, effectInventory);
    expect(wired.map((i) => i.itemId)).toEqual([
      "item-0",
      "item-1",
      "item-2",
      "item-3",
    ]);
  });

  it("keeps every pedal it was given", () => {
    const { items, effectInventory } = board(["Reverb", "Tuner", "Delay"]);
    const wired = wiredOrder(items, effectInventory);
    expect(wired.map((i) => i.itemId).sort()).toEqual(
      items.map((i) => i.itemId).sort(),
    );
  });
});
