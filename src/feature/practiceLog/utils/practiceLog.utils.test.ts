import { describe, expect, it } from "vitest";

import { normalizeRange } from "../hooks/usePracticeLogFilters";
import type {
  PracticeLogFilters,
  PracticeLogSession,
} from "../types/practiceLog.types";
import { applyFilters, getSelectedDay } from "./practiceLog.utils";

const session = (
  isoLocal: string,
  overrides: Partial<PracticeLogSession> = {},
): PracticeLogSession => ({
  id: isoLocal,
  date: new Date(isoLocal),
  title: "Session",
  type: "manual",
  points: 10,
  timeMs: 20 * 60 * 1000,
  ...overrides,
});

const filters = (
  overrides: Partial<PracticeLogFilters> = {},
): PracticeLogFilters => ({
  range: "all",
  from: null,
  to: null,
  type: "all",
  duration: "all",
  sort: "date_desc",
  ...overrides,
});

const sessions = [
  session("2026-08-01T10:00:00"),
  session("2026-08-05T10:00:00"),
  session("2026-08-10T23:30:00"),
  session("2026-08-15T00:15:00"),
];

describe("applyFilters — custom range", () => {
  it("keeps both bounds inclusive", () => {
    const result = applyFilters(
      sessions,
      filters({ range: "custom", from: "2026-08-05", to: "2026-08-10" }),
    );

    expect(result.map((s) => s.id)).toEqual([
      "2026-08-05T10:00:00",
      "2026-08-10T23:30:00",
    ]);
  });

  it("matches a single day when from equals to", () => {
    const result = applyFilters(
      sessions,
      filters({ range: "custom", from: "2026-08-15", to: "2026-08-15" }),
    );

    expect(result.map((s) => s.id)).toEqual(["2026-08-15T00:15:00"]);
  });

  it("includes sessions logged late at night on the closing day", () => {
    const result = applyFilters(
      sessions,
      filters({ range: "custom", from: "2026-08-10", to: "2026-08-10" }),
    );

    expect(result).toHaveLength(1);
  });

  it("still applies the other filters inside the range", () => {
    const result = applyFilters(
      [
        session("2026-08-05T10:00:00", { id: "short", timeMs: 5 * 60 * 1000 }),
        session("2026-08-06T10:00:00", { id: "long", timeMs: 60 * 60 * 1000 }),
      ],
      filters({
        range: "custom",
        from: "2026-08-01",
        to: "2026-08-31",
        duration: "long",
      }),
    );

    expect(result.map((s) => s.id)).toEqual(["long"]);
  });

  it("falls back to everything when a custom range has no bounds", () => {
    expect(applyFilters(sessions, filters({ range: "custom" }))).toHaveLength(
      4,
    );
  });
});

describe("getSelectedDay", () => {
  it("returns the day when the range spans one day", () => {
    expect(
      getSelectedDay(
        filters({ range: "custom", from: "2026-08-05", to: "2026-08-05" }),
      ),
    ).toBe("2026-08-05");
  });

  it("returns null for a multi-day range", () => {
    expect(
      getSelectedDay(
        filters({ range: "custom", from: "2026-08-05", to: "2026-08-09" }),
      ),
    ).toBeNull();
  });

  it("returns null for presets", () => {
    expect(getSelectedDay(filters({ range: "30d" }))).toBeNull();
  });
});

describe("normalizeRange", () => {
  it("swaps reversed bounds", () => {
    expect(normalizeRange("custom", "2026-08-20", "2026-08-04")).toEqual({
      range: "custom",
      from: "2026-08-04",
      to: "2026-08-20",
    });
  });

  it("treats a lone bound as a single day", () => {
    expect(normalizeRange("all", "2026-08-04", null)).toEqual({
      range: "custom",
      from: "2026-08-04",
      to: "2026-08-04",
    });
  });

  it("lets bounds override a preset", () => {
    expect(normalizeRange("7d", "2026-08-04", "2026-08-06")).toEqual({
      range: "custom",
      from: "2026-08-04",
      to: "2026-08-06",
    });
  });

  it("falls back to all time when custom carries no bounds", () => {
    expect(normalizeRange("custom", null, null)).toEqual({
      range: "all",
      from: null,
      to: null,
    });
  });

  it("leaves a preset untouched", () => {
    expect(normalizeRange("90d", null, null)).toEqual({
      range: "90d",
      from: null,
      to: null,
    });
  });
});
