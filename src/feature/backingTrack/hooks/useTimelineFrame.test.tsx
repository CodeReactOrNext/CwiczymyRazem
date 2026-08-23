// @vitest-environment jsdom
import type { RenderHookResult } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTimelineFrame } from "./useTimelineFrame";

/** A hand-cranked animation clock, so a "frame" is something a test can cause. */
let pending: FrameRequestCallback | null = null;
let requested = 0;
let cancelled = 0;

const step = (now = 0) => {
  const run = pending;
  pending = null;
  run?.(now);
};

/** The driver is a module singleton, so every mount has to be given back. */
const mounted: RenderHookResult<void, unknown>[] = [];
const subscribe = (draw: () => void) => {
  const result = renderHook(() => useTimelineFrame(draw));
  mounted.push(result);
  return result;
};

beforeEach(() => {
  pending = null;
  requested = 0;
  cancelled = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    requested += 1;
    pending = cb;
    return requested;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    cancelled += 1;
    pending = null;
  });
});

afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
  vi.unstubAllGlobals();
});

describe("useTimelineFrame", () => {
  it("runs every subscriber off a single loop", () => {
    // The point of the hook: six lanes plus one per stem used to mean six or
    // more independent rAF chains, and the browser laying out once per chain.
    const a = vi.fn();
    const b = vi.fn();
    subscribe(a);
    subscribe(b);

    const scheduledByMounting = requested;
    step();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    // Only the first mount starts a loop; the second joins the one running.
    expect(scheduledByMounting).toBe(1);
  });

  it("stops the loop entirely once the last subscriber leaves", () => {
    const first = subscribe(vi.fn());
    const second = subscribe(vi.fn());
    step();

    first.unmount();
    expect(cancelled).toBe(0);

    second.unmount();
    expect(cancelled).toBe(1);
  });

  it("sees fresh values without resubscribing", () => {
    // Lanes re-render continuously while being dragged; tearing the loop down
    // and rebuilding it on each of those renders is what a naive dep list does.
    let value = "before";
    const seen: string[] = [];
    const result = renderHook(() => useTimelineFrame(() => seen.push(value)));
    mounted.push(result);

    step();
    value = "after";
    result.rerender();
    step();

    expect(seen).toEqual(["before", "after"]);
    expect(cancelled).toBe(0);
  });

  it("drops a throwing subscriber instead of freezing the whole screen", () => {
    // Only setTimeout: faking rAF as well would replace the hand-cranked clock.
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const healthy = vi.fn();
    const broken = vi.fn(() => {
      throw new Error("bad lane");
    });
    subscribe(broken);
    subscribe(healthy);

    step();
    step();

    expect(broken).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledTimes(2);
    // Rethrown out of band so the error still reaches the reporter.
    expect(() => vi.runAllTimers()).toThrow("bad lane");
    vi.useRealTimers();
  });
});
