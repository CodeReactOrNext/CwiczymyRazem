// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useTablatureHeight } from "./useTablatureHeight";
import { TAB_BASE_HEIGHT } from "./useTablatureWorkerBridge";

const KEY = "practice-tab-height-test";
const options = { storageKey: KEY, min: 180, max: 460 };

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("useTablatureHeight", () => {
  it("starts at the base height, not as a height the player chose", () => {
    const { result } = renderHook(() => useTablatureHeight(options));

    expect(result.current.height).toBe(TAB_BASE_HEIGHT);
    expect(result.current.isCustom).toBe(false);
  });

  it("keeps a dragged height, clamped, across mounts", () => {
    const { result } = renderHook(() => useTablatureHeight(options));
    act(() => result.current.setHeight(900));

    expect(result.current.height).toBe(460);
    expect(result.current.isCustom).toBe(true);

    const remounted = renderHook(() => useTablatureHeight(options));
    expect(remounted.result.current.height).toBe(460);
    expect(remounted.result.current.isCustom).toBe(true);
  });

  it("forgets the dragged height on clear, so a self-sizing viewer takes over again", () => {
    window.localStorage.setItem(KEY, "220");
    const { result } = renderHook(() => useTablatureHeight(options));
    expect(result.current.isCustom).toBe(true);

    act(() => result.current.clearHeight());

    expect(result.current.isCustom).toBe(false);
    expect(result.current.height).toBe(TAB_BASE_HEIGHT);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});
