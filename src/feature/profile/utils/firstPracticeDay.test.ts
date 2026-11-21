import { describe, expect, it } from "vitest";

import { getFirstPracticeDay, isBeforeFirstPractice } from "./firstPracticeDay";

const at = (iso: string) => ({ date: new Date(iso) });

describe("getFirstPracticeDay", () => {
  it("is Infinity for a player who has not practised yet", () => {
    expect(getFirstPracticeDay([])).toBe(Infinity);
  });

  it("finds the earliest day whatever the order of the reports", () => {
    const first = getFirstPracticeDay([
      at("2026-11-20T18:30:00"),
      at("2026-11-19T07:15:00"),
      at("2026-11-21T22:00:00"),
    ]);
    expect(first).toBe(new Date("2026-11-19T00:00:00").getTime());
  });
});

describe("isBeforeFirstPractice", () => {
  const first = getFirstPracticeDay([at("2026-11-19T20:00:00")]);

  it("covers the days before the first practice", () => {
    expect(isBeforeFirstPractice(new Date("2026-11-16T00:00:00"), first)).toBe(
      true,
    );
    expect(isBeforeFirstPractice(new Date("2026-11-18T23:59:00"), first)).toBe(
      true,
    );
  });

  it("stops at the first practice day itself, at any hour of it", () => {
    expect(isBeforeFirstPractice(new Date("2026-11-19T00:00:00"), first)).toBe(
      false,
    );
    expect(isBeforeFirstPractice(new Date("2026-11-20T00:00:00"), first)).toBe(
      false,
    );
  });

  it("covers every day for a player with no practice at all", () => {
    expect(
      isBeforeFirstPractice(new Date("2026-11-18T00:00:00"), Infinity),
    ).toBe(true);
  });
});
