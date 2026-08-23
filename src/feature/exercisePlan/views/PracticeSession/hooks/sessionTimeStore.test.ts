import { beforeEach, describe, expect, it } from "vitest";

import { sumSessionTime, useSessionTimeStore } from "./sessionTimeStore";

describe("sessionTimeStore", () => {
  beforeEach(() => {
    useSessionTimeStore.getState().reset();
  });

  it("accumulates ticks per category", () => {
    const { add } = useSessionTimeStore.getState();
    add("technique", 1000);
    add("technique", 2000);
    add("theory", 500);

    expect(useSessionTimeStore.getState().time).toEqual({
      technique: 3000,
      theory: 500,
      hearing: 0,
      creativity: 0,
    });
  });

  it("starts every session from zero", () => {
    useSessionTimeStore.getState().add("theory", 3 * 60 * 1000);
    useSessionTimeStore.getState().reset();
    useSessionTimeStore.getState().add("technique", 3 * 60 * 1000);

    // A technique-only session reports technique only, however much unreported
    // theory time was lying around before it started.
    expect(useSessionTimeStore.getState().time.theory).toBe(0);
    expect(sumSessionTime(useSessionTimeStore.getState().time)).toBe(3 * 60 * 1000);
  });
});
