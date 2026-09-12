import { describe, expect, it } from "vitest";

import { EFFECT_FEATURES } from "../data/effectStats";
import { GUITAR_FEATURES } from "../data/itemStats";
import { getModCategory, layoutModSockets } from "./modAnchors";

const firstOf = (category: string) =>
  GUITAR_FEATURES.find((f) => f.category === category)!.id;

describe("getModCategory", () => {
  it("reads the category off the feature pool for either kind", () => {
    expect(getModCategory("guitar", firstOf("pickups"))).toBe("pickups");
    const pedalMod = EFFECT_FEATURES[0];
    expect(getModCategory("effect", pedalMod.id)).toBe(pedalMod.category);
    expect(getModCategory("guitar", "no-such-mod")).toBeUndefined();
  });
});

describe("layoutModSockets", () => {
  it("lands each category on its own part of the instrument, top to bottom", () => {
    const layout = layoutModSockets("guitar", [
      firstOf("sustain"),
      firstOf("playFeeling"),
      firstOf("pickups"),
    ]);
    // Sorted by where they land, not by the order they were fitted.
    expect(layout.map((l) => getModCategory("guitar", l.modId))).toEqual([
      "playFeeling",
      "pickups",
      "sustain",
    ]);
    const ys = layout.map((l) => l.anchor.y);
    expect(ys[0]).toBeLessThan(ys[1]);
    expect(ys[1]).toBeLessThan(ys[2]);
  });

  it("deals sockets to alternating sides and stops each wire at that side's edge", () => {
    const layout = layoutModSockets("guitar", [
      firstOf("playFeeling"),
      firstOf("pickups"),
      firstOf("sustain"),
    ]);
    expect(layout.map((l) => l.side)).toEqual(["left", "right", "left"]);
    for (const l of layout) {
      if (l.side === "left") expect(l.anchor.x).toBeLessThan(0.5);
      else expect(l.anchor.x).toBeGreaterThan(0.5);
    }
    // The neck is narrower than the body, so its wire stops nearer the centre.
    const neck = layout[0].anchor.x;
    const body = layout[2].anchor.x;
    expect(0.5 - neck).toBeLessThan(0.5 - body);
  });

  it("fans siblings of one category out so connectors never overlap", () => {
    const pickups = GUITAR_FEATURES.filter((f) => f.category === "pickups")
      .slice(0, 3)
      .map((f) => f.id);
    const ys = layoutModSockets("guitar", pickups).map((l) => l.anchor.y);
    expect(new Set(ys).size).toBe(3);
    expect(ys[1]).toBeGreaterThan(ys[0]);
    expect(ys[2]).toBeGreaterThan(ys[1]);
  });

  it("falls back to the centre for an unknown mod instead of throwing", () => {
    const [only] = layoutModSockets("effect", ["mystery"]);
    expect(only.side).toBe("left");
    expect(only.anchor.y).toBe(0.5);
    expect(only.anchor.x).toBeGreaterThan(0);
    expect(only.anchor.x).toBeLessThan(0.5);
  });
});
