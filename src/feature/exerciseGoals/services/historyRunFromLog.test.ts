import { describe, expect, it, vi } from "vitest";

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

import { historyRunFromLog } from "./exerciseGoals.service";

const BEFORE = Date.UTC(2026, 9, 10);
const log = (overrides: Record<string, unknown> = {}) => ({
  uid: "u1",
  exerciseIds: ["spider"],
  micPerformance: { score: 1200, accuracy: 91.6, bpm: 104.4 },
  timestamp: "2026-10-01T18:00:00.000Z",
  ...overrides,
});

describe("historyRunFromLog", () => {
  it("turns a scored session of the exercise into a practice point", () => {
    expect(historyRunFromLog("l1", log(), "spider", BEFORE)).toEqual({
      id: "l1",
      exerciseId: "spider",
      bpm: 104,
      accuracy: 92,
      source: "practice",
      goalId: null,
      clean: null,
      createdAt: Date.UTC(2026, 9, 1, 18),
      timingOffsetMs: null,
      timingBiasMs: null,
    });
  });

  it("skips plans, where the scored run may be another exercise's", () => {
    expect(
      historyRunFromLog(
        "l1",
        log({ exerciseIds: ["spider", "chromatic"] }),
        "spider",
        BEFORE,
      ),
    ).toBeNull();
  });

  it("skips sessions without a tempo", () => {
    expect(
      historyRunFromLog(
        "l1",
        log({ micPerformance: { score: 10, accuracy: 90 } }),
        "spider",
        BEFORE,
      ),
    ).toBeNull();
    expect(
      historyRunFromLog(
        "l1",
        log({ micPerformance: undefined }),
        "spider",
        BEFORE,
      ),
    ).toBeNull();
  });

  it("leaves what the tracked runs already cover", () => {
    expect(
      historyRunFromLog(
        "l1",
        log({ timestamp: "2026-10-11T08:00:00.000Z" }),
        "spider",
        BEFORE,
      ),
    ).toBeNull();
  });
});
