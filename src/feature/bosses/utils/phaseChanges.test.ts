import { describe, expect, it } from "vitest";

import type { SpiderVariation } from "../types/boss.types";
import { describePhaseChanges, fretSpan, threatsOf } from "./phaseChanges";
import type { PhasePlan } from "./phaseGenerator";
import { generatePhase } from "./phaseGenerator";

type PlanOverrides = Omit<Partial<PhasePlan>, "variation"> & {
  variation?: Partial<SpiderVariation>;
};

const plan = (overrides: PlanOverrides): PhasePlan => {
  const base = generatePhase(1, 0);
  return {
    ...base,
    slams: false,
    weakSpots: false,
    affixes: [],
    ...overrides,
    variation: {
      bpm: 96,
      notesPerBeat: 2,
      patterns: ["1234"],
      route: "walk",
      positions: [5],
      ...overrides.variation,
    },
  };
};

describe("describePhaseChanges", () => {
  it("names what the next phase changes", () => {
    const before = plan({ slams: true, affixes: ["frenzy"] });
    const after = plan({
      slams: true,
      weakSpots: true,
      affixes: ["venom"],
      variation: { notesPerBeat: 3, route: "skip", patterns: ["1324", "4231"], positions: [7] },
    });
    const changes = describePhaseChanges(before, after, 96, 104);
    expect(changes.bpm).toEqual({ from: 96, to: 104 });
    // 96 eighths → 104 triplets: (104 × 3) / (96 × 2) − 1.
    expect(changes.speedChange).toBeCloseTo(0.625, 3);
    expect(changes.rhythm).toEqual({ from: 2, to: 3, changed: true });
    expect(changes.route).toEqual({ to: "skip", changed: true });
    expect(changes.patterns).toEqual({ to: ["1324", "4231"], changed: true });
    expect(changes.frets).toEqual({ low: 7, high: 10, changed: true });
    expect(changes.gained).toEqual(["weak_spots", "venom"]);
    expect(changes.lost).toEqual(["frenzy"]);
  });

  it("marks what stays the same", () => {
    const same = plan({});
    const changes = describePhaseChanges(same, plan({ variation: { bpm: 110 } }), 96, 110);
    expect(changes.rhythm.changed).toBe(false);
    expect(changes.route.changed).toBe(false);
    expect(changes.patterns.changed).toBe(false);
    expect(changes.frets.changed).toBe(false);
    expect(changes.gained).toEqual([]);
    expect(changes.lost).toEqual([]);
  });

  it("judges speed by the notes, not the BPM alone", () => {
    const quarters = plan({ variation: { notesPerBeat: 1 } });
    const eighths = plan({ variation: { notesPerBeat: 2 } });
    expect(describePhaseChanges(quarters, eighths, 96, 66).speedChange).toBeCloseTo(66 * 2 / 96 - 1, 3);
    expect(describePhaseChanges(quarters, eighths, 96, 66).speedChange).toBeGreaterThan(0);
  });

  it("treats the same finger orders in another order as unchanged", () => {
    const a = plan({ variation: { patterns: ["1234", "4321"] } });
    const b = plan({ variation: { patterns: ["4321", "1234"] } });
    expect(describePhaseChanges(a, b, 90, 90).patterns.changed).toBe(false);
  });
});

describe("threatsOf / fretSpan", () => {
  it("lists a phase's threats and the frets it spans", () => {
    expect(threatsOf(plan({ slams: true, affixes: ["web"] }))).toEqual(["slams", "web"]);
    expect(fretSpan(plan({ variation: { positions: [3, 4] } }))).toEqual({ low: 3, high: 7 });
  });
});
