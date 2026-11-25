import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  beginSessionEntry,
  COVER_MS,
  coverForSessionEntry,
  endSessionEntryNavigation,
  HANDOVER_MS,
  holdSessionEntry,
  isSessionEntryPath,
  markSessionEntryScene,
  MAX_WAIT_MS,
  MIN_SCENE_MS,
  OUT_MS,
  releaseSessionEntry,
  resetSessionEntry,
  SCENE_WAIT_MS,
  setSessionEntrySteps,
  useSessionEntryStore,
} from "./sessionEntryStore";

const phase = () => useSessionEntryStore.getState().phase;

describe("sessionEntryStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetSessionEntry();
  });
  afterEach(() => {
    resetSessionEntry();
    vi.useRealTimers();
  });

  it("wipes in on navigation and out once the session has loaded and the strike has played", () => {
    beginSessionEntry();
    expect(useSessionEntryStore.getState()).toMatchObject({ phase: "in", instant: false });

    markSessionEntryScene();
    holdSessionEntry("page");
    endSessionEntryNavigation();
    vi.advanceTimersByTime(5000);
    expect(phase()).toBe("in");

    releaseSessionEntry("page");
    vi.advanceTimersByTime(HANDOVER_MS);
    expect(phase()).toBe("out");
    vi.advanceTimersByTime(OUT_MS);
    expect(phase()).toBe("idle");
  });

  it("does not leave before the strike has landed", () => {
    beginSessionEntry();
    markSessionEntryScene();
    endSessionEntryNavigation();
    vi.advanceTimersByTime(MIN_SCENE_MS - 50);
    expect(phase()).toBe("in");
    vi.advanceTimersByTime(50);
    expect(phase()).toBe("out");
  });

  it("stays up while one loader hands over to the next", () => {
    holdSessionEntry("page");
    markSessionEntryScene();
    vi.advanceTimersByTime(3000);
    releaseSessionEntry("page");
    vi.advanceTimersByTime(HANDOVER_MS - 10);
    holdSessionEntry("session");
    vi.advanceTimersByTime(3000);
    expect(phase()).toBe("in");
    expect(useSessionEntryStore.getState().run).toBe(1);
  });

  it("covers at once, without the wipe, when a session is opened by its address", () => {
    holdSessionEntry("page");
    expect(useSessionEntryStore.getState()).toMatchObject({ phase: "in", instant: true });
  });

  it("stays up during the route change even with no loader yet", () => {
    beginSessionEntry();
    markSessionEntryScene();
    vi.advanceTimersByTime(10_000);
    expect(phase()).toBe("in");
  });

  it("does not wait forever for a scene that never arrives", () => {
    beginSessionEntry();
    endSessionEntryNavigation();
    vi.advanceTimersByTime(SCENE_WAIT_MS + HANDOVER_MS + 100);
    expect(phase()).toBe("out");
  });

  it("gives up on a loader that never finishes", () => {
    holdSessionEntry("page");
    vi.advanceTimersByTime(MAX_WAIT_MS);
    expect(phase()).toBe("out");
    // The stuck loader unmounting later changes nothing.
    releaseSessionEntry("page");
    vi.advanceTimersByTime(OUT_MS);
    expect(phase()).toBe("idle");
  });

  it("shows loading steps only while the cut is up, and clears them after", () => {
    const steps = [{ key: "file", label: "File", state: "running" as const }];
    setSessionEntrySteps(steps);
    expect(useSessionEntryStore.getState().steps).toEqual([]);

    holdSessionEntry("session");
    markSessionEntryScene();
    setSessionEntrySteps(steps);
    expect(useSessionEntryStore.getState().steps).toEqual(steps);

    releaseSessionEntry("session");
    vi.advanceTimersByTime(MIN_SCENE_MS + HANDOVER_MS + OUT_MS);
    expect(useSessionEntryStore.getState()).toMatchObject({ phase: "idle", steps: [] });
  });

  it("knows which pages open with a session", () => {
    expect(isSessionEntryPath("/practice/exercise/spider")).toBe(true);
    expect(isSessionEntryPath("/songs/practice/abc")).toBe(true);
    expect(isSessionEntryPath("/onboarding/first-riff")).toBe(true);
    expect(isSessionEntryPath("/onboarding/first-hunt?level=new")).toBe(true);
    expect(isSessionEntryPath("/songs")).toBe(false);
    expect(isSessionEntryPath("/dashboard")).toBe(false);
  });
});

describe("coverForSessionEntry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetSessionEntry();
  });
  afterEach(() => {
    resetSessionEntry();
    vi.useRealTimers();
  });

  it("wipes in over the page and calls back only once it is covered", () => {
    const onCovered = vi.fn();
    coverForSessionEntry("gate", onCovered);
    expect(useSessionEntryStore.getState()).toMatchObject({ phase: "in", instant: false });
    vi.advanceTimersByTime(COVER_MS - 1);
    expect(onCovered).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onCovered).toHaveBeenCalledTimes(1);
  });

  it("holds until the session's own loader has taken over", () => {
    coverForSessionEntry("gate", () => holdSessionEntry("session"));
    markSessionEntryScene();
    vi.advanceTimersByTime(10_000);
    expect(phase()).toBe("in");
    expect(useSessionEntryStore.getState().run).toBe(1);
    releaseSessionEntry("session");
    vi.advanceTimersByTime(HANDOVER_MS);
    expect(phase()).toBe("out");
  });

  it("leaves without the session when it is called off", () => {
    const onCovered = vi.fn();
    const cancel = coverForSessionEntry("gate", onCovered);
    markSessionEntryScene();
    cancel();
    vi.advanceTimersByTime(MIN_SCENE_MS + HANDOVER_MS);
    expect(onCovered).not.toHaveBeenCalled();
    expect(phase()).toBe("out");
  });
});
