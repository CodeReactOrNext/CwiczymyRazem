import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  normalizeDefaultViewMode,
} from "./tablatureSettings";

describe("normalizeDefaultViewMode", () => {
  it("keeps the two views that still exist", () => {
    expect(normalizeDefaultViewMode("tab")).toBe("tab");
    expect(normalizeDefaultViewMode("notation")).toBe("notation");
  });

  // The 3D highway was removed after shipping as a selectable default view, so
  // localStorage on an existing install can still hold it. It has to resolve to
  // the flat tab rather than leaving the session with no viewer at all.
  it("falls back to the flat tab for the removed 3D highway", () => {
    expect(normalizeDefaultViewMode("highway")).toBe("tab");
  });

  it("falls back to the flat tab for anything unrecognised", () => {
    expect(normalizeDefaultViewMode(undefined)).toBe("tab");
    expect(normalizeDefaultViewMode(null)).toBe("tab");
    expect(normalizeDefaultViewMode("")).toBe("tab");
    expect(normalizeDefaultViewMode(42)).toBe("tab");
  });

  it("agrees with the shipped default", () => {
    expect(normalizeDefaultViewMode(DEFAULT_SETTINGS.defaultViewMode)).toBe(
      DEFAULT_SETTINGS.defaultViewMode,
    );
  });
});
