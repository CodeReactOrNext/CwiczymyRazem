// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import {
  MAX_REMEMBERED_ZOOMS,
  rememberedZoom,
  useTabZoomMemory,
} from "./useAutoTabZoom";

afterEach(() => {
  useTabZoomMemory.setState({ entries: [] });
  window.localStorage.clear();
});

describe("useTabZoomMemory", () => {
  it("keeps the last spacing per exercise", () => {
    const { remember } = useTabZoomMemory.getState();
    remember("a", 0.7);
    remember("b", 1.2);
    remember("a", 0.5);

    expect(rememberedZoom("a")).toBe(0.5);
    expect(rememberedZoom("b")).toBe(1.2);
    expect(rememberedZoom("c")).toBeUndefined();
    expect(useTabZoomMemory.getState().entries).toHaveLength(2);
  });

  it("forgets the exercises left longest ago once it is full", () => {
    const { remember } = useTabZoomMemory.getState();
    for (let i = 0; i < MAX_REMEMBERED_ZOOMS; i++) remember(String(i), 1);
    // Touching the oldest moves it to the recent end, so the next one goes instead.
    remember("0", 0.8);
    remember("new", 0.6);

    expect(useTabZoomMemory.getState().entries).toHaveLength(
      MAX_REMEMBERED_ZOOMS,
    );
    expect(rememberedZoom("0")).toBe(0.8);
    expect(rememberedZoom("1")).toBeUndefined();
    expect(rememberedZoom("2")).toBe(1);
    expect(rememberedZoom("new")).toBe(0.6);
  });
});
