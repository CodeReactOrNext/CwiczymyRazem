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

describe("sessionTimeStore song time", () => {
  beforeEach(() => {
    useSessionTimeStore.getState().reset();
  });

  it("credits a song item's ticks to the song without adding to the category total", () => {
    const { add } = useSessionTimeStore.getState();
    add("technique", 1000, "song-a");
    add("technique", 2000, "song-a");
    add("technique", 500);
    add("hearing", 700, "song-b");

    const state = useSessionTimeStore.getState();
    expect(state.songTime).toEqual({ "song-a": 3000, "song-b": 700 });
    // The song shares are a slice of the totals, never on top of them.
    expect(state.time.technique).toBe(3500);
    expect(sumSessionTime(state.time)).toBe(4200);
  });

  it("clears the song ledger with the rest of the session", () => {
    useSessionTimeStore.getState().add("technique", 1000, "song-a");
    useSessionTimeStore.getState().reset();

    expect(useSessionTimeStore.getState().songTime).toEqual({});
  });
});
