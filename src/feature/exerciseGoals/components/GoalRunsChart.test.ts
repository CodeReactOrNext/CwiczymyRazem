import { describe, expect, it } from "vitest";

import { bpmAxis, timingAxis } from "./GoalRunsChart";

describe("bpmAxis", () => {
  it("lands the ticks on round tempos around the runs and the goal", () => {
    expect(bpmAxis([90, 95, 105, 115], 115)).toEqual({
      domain: [80, 120],
      ticks: [80, 90, 100, 110, 120],
    });
  });

  it("keeps the goal on the axis when no run has reached it", () => {
    const { domain } = bpmAxis([60, 64], 140);
    expect(domain[0]).toBeLessThanOrEqual(60);
    expect(domain[1]).toBeGreaterThanOrEqual(140);
  });

  it("uses a fine step for a narrow spread", () => {
    expect(bpmAxis([112, 114], 115).ticks).toEqual([105, 110, 115, 120]);
  });

  it("never goes below zero", () => {
    expect(bpmAxis([3], 5).domain[0]).toBe(0);
  });
});

describe("timingAxis", () => {
  it("starts on the beat and never spans less than 100 ms", () => {
    expect(timingAxis([12, 30])).toEqual({
      domain: [0, 100],
      ticks: [0, 25, 50, 75, 100],
    });
  });

  it("stretches to the loosest run on a coarser step", () => {
    expect(timingAxis([40, 170]).domain).toEqual([0, 200]);
    expect(timingAxis([40, 170]).ticks).toEqual([0, 50, 100, 150, 200]);
  });
});
