// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useProgressiveCount } from "./useProgressiveCount";

/**
 * The picker must not mount a whole collection in the frame it opens, and it
 * must not leave any of it out either.
 */
describe("useProgressiveCount", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("draws a short list whole, straight away", () => {
    const { result } = renderHook(() => useProgressiveCount(5, 12, 18));
    expect(result.current).toBe(5);
  });

  it("starts a long list with one screenful and adds a batch per frame", () => {
    const { result } = renderHook(() => useProgressiveCount(40, 12, 18));
    expect(result.current).toBe(12);

    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current).toBe(30);

    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current).toBe(40);
  });
});
