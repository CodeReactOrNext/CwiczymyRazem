import { describe, expect, it } from "vitest";

import { createFramePace, observeFrame, resetFramePace } from "./framePace";

/** Feeds `seconds` of frames `stepMs` apart, starting at `from`; returns [reported, end]. */
function run(pace: ReturnType<typeof createFramePace>, from: number, seconds: number, stepMs: number): [boolean, number] {
  let reported = false;
  let t = from;
  for (; t < from + seconds * 1000; t += stepMs) {
    if (observeFrame(pace, t)) reported = true;
  }
  return [reported, t];
}

describe("framePace", () => {
  it("leaves a board that holds 60 fps alone", () => {
    const pace = createFramePace();
    expect(run(pace, 0, 30, 1000 / 60)[0]).toBe(false);
  });

  it("reports a board stuck around 25 fps, once", () => {
    const pace = createFramePace();
    const [reported, end] = run(pace, 0, 10, 40);
    expect(reported).toBe(true);
    expect(run(pace, end, 10, 40)[0]).toBe(false);
  });

  it("forgives a slow start", () => {
    const pace = createFramePace();
    const [slowStart, end] = run(pace, 0, 2.5, 50);
    expect(slowStart).toBe(false);
    expect(run(pace, end, 20, 1000 / 60)[0]).toBe(false);
  });

  it("does not take one bad window for a slow device", () => {
    const pace = createFramePace();
    let [, t] = run(pace, 0, 6, 1000 / 60);
    let reported: boolean;
    [reported, t] = run(pace, t, 2.2, 45);
    expect(reported).toBe(false);
    expect(run(pace, t, 10, 1000 / 60)[0]).toBe(false);
  });

  it("ignores the gap of a tab left in the background", () => {
    const pace = createFramePace();
    let t = 0;
    let reported = false;
    // 60 fps in bursts, with seconds of nothing in between.
    for (let burst = 0; burst < 20; burst++) {
      const [r, end] = run(pace, t, 1, 1000 / 60);
      reported = reported || r;
      t = end + 5000;
    }
    expect(reported).toBe(false);
  });

  it("starts counting again after a reset", () => {
    const pace = createFramePace();
    const [first, end] = run(pace, 0, 5, 40);
    expect(first).toBe(false);
    resetFramePace(pace);
    // Warm-up and both slow windows are needed again.
    expect(run(pace, end, 5, 40)[0]).toBe(false);
  });
});
