import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  isWeakDevice,
  liteTablatureStyle,
  migrateTablatureSettings,
  normalizeDefaultViewMode,
  resolveTabLite,
} from "./tablatureSettings";
import { boardPixelRatio } from "./useTablatureWorkerBridge";

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

describe("pagedScroll", () => {
  it("defaults to the standing (paged) board", () => {
    expect(DEFAULT_SETTINGS.pagedScroll).toBe(true);
  });

  it("moves installs from before v6 onto the paged board", () => {
    expect(
      migrateTablatureSettings({ ...DEFAULT_SETTINGS, pagedScroll: false }, 5),
    ).toMatchObject({ pagedScroll: true });
  });

  it("keeps a choice made on v6 or later", () => {
    expect(
      migrateTablatureSettings({ ...DEFAULT_SETTINGS, pagedScroll: false }, 6),
    ).toMatchObject({ pagedScroll: false });
  });
});

describe("noteStyle", () => {
  it("defaults to head + tail", () => {
    expect(DEFAULT_SETTINGS.noteStyle).toBe("headTail");
  });

  it("heals a missing or unknown stored style and keeps a valid one", () => {
    const migrate = migrateTablatureSettings;
    expect(
      migrate({ ...DEFAULT_SETTINGS, noteStyle: undefined }),
    ).toMatchObject({ noteStyle: "headTail" });
    expect(
      migrate({ ...DEFAULT_SETTINGS, noteStyle: "blob" }),
    ).toMatchObject({ noteStyle: "headTail" });
    expect(
      migrate({ ...DEFAULT_SETTINGS, noteStyle: "bar" }),
    ).toMatchObject({ noteStyle: "bar" });
  });
});

describe("lite board", () => {
  it("defaults to auto, with nothing detected yet", () => {
    expect(DEFAULT_SETTINGS.performanceMode).toBe("auto");
    expect(DEFAULT_SETTINGS.liteDetected).toBe(false);
  });

  it("heals an unknown stored mode and keeps a valid one", () => {
    expect(
      migrateTablatureSettings({ ...DEFAULT_SETTINGS, performanceMode: "turbo" }),
    ).toMatchObject({ performanceMode: "auto" });
    expect(
      migrateTablatureSettings({ ...DEFAULT_SETTINGS, performanceMode: "lite", liteDetected: true }),
    ).toMatchObject({ performanceMode: "lite", liteDetected: true });
    expect(
      migrateTablatureSettings({ ...DEFAULT_SETTINGS, liteDetected: "yes" }),
    ).toMatchObject({ liteDetected: false });
  });

  it("follows the player's own choice on any device", () => {
    expect(resolveTabLite("lite", false, false, false)).toBe(true);
    expect(resolveTabLite("full", true, true, true)).toBe(false);
  });

  it("goes lite on its own only on a phone that is weak or was caught lagging", () => {
    expect(resolveTabLite("auto", true, false, false)).toBe(false);
    expect(resolveTabLite("auto", true, true, false)).toBe(true);
    expect(resolveTabLite("auto", true, false, true)).toBe(true);
    // A desktop board is never changed behind the player's back.
    expect(resolveTabLite("auto", false, true, true)).toBe(false);
  });

  it("calls a device weak only on little memory or four cores", () => {
    expect(isWeakDevice(undefined)).toBe(false);
    expect(isWeakDevice({})).toBe(false);
    expect(isWeakDevice({ deviceMemory: 2, hardwareConcurrency: 8 })).toBe(true);
    expect(isWeakDevice({ deviceMemory: 4, hardwareConcurrency: 8 })).toBe(false);
    expect(isWeakDevice({ hardwareConcurrency: 4 })).toBe(true);
    // An iPhone reports no memory at all.
    expect(isWeakDevice({ hardwareConcurrency: 6 })).toBe(false);
  });

  it("stands the board still and drops the hit animations", () => {
    expect(
      liteTablatureStyle({ pagedScroll: false, hitAnimations: true, timingHints: true }),
    ).toEqual({ pagedScroll: true, hitAnimations: false, timingHints: true, lite: true });
  });

  it("caps the canvas's pixel ratio, never raising it", () => {
    expect(boardPixelRatio(3, 2)).toBe(2);
    expect(boardPixelRatio(1, 2)).toBe(1);
    expect(boardPixelRatio(2.625)).toBe(2.625);
    expect(boardPixelRatio(undefined, 1.5)).toBe(1);
  });
});
