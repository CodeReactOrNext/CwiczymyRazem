import { describe, expect, it } from "vitest";

import { boonPreview } from "./boonPreview";
import { synergiesWith } from "./boons";
import { phaseBpm } from "./bossEngine";
import { fightWith } from "./fightFixtures";

describe("boonPreview", () => {
  it("puts a boon in the player's own numbers", () => {
    const fight = { ...fightWith({ biteDamage: 10 }), playerHp: 62 };
    expect(boonPreview(fight, "bandage")).toEqual({ from: 62, to: 97 });
    expect(boonPreview(fight, "armor")).toEqual({ from: 10, to: 8 });
    expect(boonPreview({ ...fight, boons: { armor: 1 } }, "armor")).toEqual({ from: 8, to: 6 });
    expect(boonPreview(fight, "vitality")).toEqual({ from: 100, to: 120 });
    expect(boonPreview(fight, "steadyHand")).toEqual({ from: 4, to: 2 });
  });

  it("caps a heal at full HP", () => {
    expect(boonPreview({ ...fightWith(), playerHp: 90 }, "bandage")).toEqual({ from: 90, to: 100 });
  });

  it("shows tempo boons as the phase's tempo", () => {
    const fight = fightWith();
    const bpm = phaseBpm(fight);
    expect(boonPreview(fight, "slowDown")).toEqual({ from: bpm, to: Math.max(50, bpm - 5) });
    expect(boonPreview(fight, "overdrive")).toEqual({ from: bpm, to: Math.min(200, bpm + 10) });
  });

  it("has nothing to count for a boon that changes a rule", () => {
    expect(boonPreview(fightWith(), "antidote")).toBeNull();
    expect(boonPreview(fightWith(), "clearSight")).toBeNull();
  });
});

describe("synergiesWith", () => {
  it("names the boons in the build a card pairs with", () => {
    expect(synergiesWith("lightBlade", { blade: 2, armor: 1 })).toEqual(["blade"]);
    expect(synergiesWith("lightBlade", {})).toEqual([]);
  });
});
