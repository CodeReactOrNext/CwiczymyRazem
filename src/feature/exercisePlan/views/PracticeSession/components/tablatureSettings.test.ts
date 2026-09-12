import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  migrateTablatureSettings,
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

describe("metronomeSound", () => {
  it("defaults to the classic click", () => {
    expect(DEFAULT_SETTINGS.metronomeSound).toBe("classic");
  });

  // The sound picker landed in store v5; a v4 install has no such key at all,
  // and a later build could drop a sound. Either way the metronome must still
  // find a real sound to play, so the migration heals the value.
  it("heals a missing or unknown stored sound back to the classic click", () => {
    const migrate = migrateTablatureSettings;
    expect(
      migrate({ ...DEFAULT_SETTINGS, metronomeSound: undefined }),
    ).toMatchObject({
      metronomeSound: "classic",
    });
    expect(
      migrate({ ...DEFAULT_SETTINGS, metronomeSound: "laser" }),
    ).toMatchObject({
      metronomeSound: "classic",
    });
    expect(
      migrate({ ...DEFAULT_SETTINGS, metronomeSound: "wood" }),
    ).toMatchObject({
      metronomeSound: "wood",
    });
  });
});
