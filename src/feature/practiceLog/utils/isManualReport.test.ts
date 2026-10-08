import { describe, expect, it } from "vitest";

import { isManualReport } from "./isManualReport";

const songs = [{ songId: "s1", practiceMs: 60000 }];

describe("isManualReport", () => {
  it("treats a plain manual log as manual", () => {
    expect(isManualReport({})).toBe(true);
  });

  it("treats a manual log attributed to songs as manual", () => {
    expect(isManualReport({ songId: "s1", songs })).toBe(true);
  });

  it("locks the standalone song timer (bare songId)", () => {
    expect(isManualReport({ songId: "s1" })).toBe(false);
  });

  it("locks plan sessions, even with songs in the routine", () => {
    expect(isManualReport({ planId: "p1" })).toBe(false);
    expect(isManualReport({ planId: "p1", songId: "s1", songs })).toBe(false);
  });
});
