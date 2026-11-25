import { describe, expect, it } from "vitest";

import { createBarPassCounter } from "./barPasses";

const play = (counter: ReturnType<typeof createBarPassCounter>, hits: boolean[]) =>
  hits.reduce((_, hit, i) => counter.judge(`0-${i}-0`, hit), 0);

describe("createBarPassCounter", () => {
  it("counts a pass once every note of the bar was hit", () => {
    const counter = createBarPassCounter(3);
    expect(counter.judge("0-0-0", true)).toBe(0);
    expect(counter.judge("0-1-0", true)).toBe(0);
    expect(counter.judge("0-2-0", true)).toBe(1);
  });

  it("does not count a pass with a miss, and starts the next one fresh", () => {
    const counter = createBarPassCounter(3);
    expect(play(counter, [true, false, true])).toBe(0);
    expect(play(counter, [true, true, true])).toBe(1);
  });

  it("drops a pass that was started over half way", () => {
    const counter = createBarPassCounter(3);
    counter.judge("0-0-0", true);
    counter.judge("0-1-0", false);
    expect(play(counter, [true, true, true])).toBe(1);
  });

  it("takes notes judged out of order", () => {
    const counter = createBarPassCounter(2);
    counter.judge("0-1-0", true);
    expect(counter.judge("0-0-0", true)).toBe(1);
  });
});
