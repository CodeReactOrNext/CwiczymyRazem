import { describe, expect, it } from "vitest";

import type { SalvagedModOption } from "../data/salvage";
import { formatModSlot, groupSlotChoices } from "./modSlotOptions";

const offer = (
  salvagedId: string,
  featureId: string,
  label: string,
  points: number,
): SalvagedModOption => ({
  salvagedId,
  featureId,
  label,
  points,
  sourceName: "Old Strat",
});

const stash = [
  offer("s1", "copper-shielding", "Copper shielding", 1),
  offer("s2", "copper-shielding", "Copper shielding", 3),
  offer("s3", "treble-bleed", "Treble bleed", 2),
  offer("s4", "phase-switch", "Phase switch", 1),
];

describe("groupSlotChoices", () => {
  it("folds copies of one mod into a single row with a count and the best copy", () => {
    const copper = groupSlotChoices(stash).find(
      (c) => c.featureId === "copper-shielding",
    )!;
    expect(copper.owned).toBe(2);
    expect(copper.points).toBe(3);
    expect(copper.salvagedId).toBe("s2");
  });

  it("orders the best value first, then by name", () => {
    expect(groupSlotChoices(stash).map((c) => c.label)).toEqual([
      "Copper shielding",
      "Treble bleed",
      "Phase switch",
    ]);
  });

  it("searches the label, case-insensitively", () => {
    expect(groupSlotChoices(stash, "TREB").map((c) => c.label)).toEqual([
      "Treble bleed",
    ]);
    expect(groupSlotChoices(stash, "nothing")).toEqual([]);
  });
});

describe("formatModSlot", () => {
  it("counts from one and pads to two digits", () => {
    expect(formatModSlot(0)).toBe("01");
    expect(formatModSlot(12)).toBe("13");
  });
});
