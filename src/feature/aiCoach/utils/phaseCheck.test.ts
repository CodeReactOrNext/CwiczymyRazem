import { describe, expect, it } from "vitest";

import type { RoadmapPhase, RoadmapStep } from "../types/roadmap.types";
import {
  allCheckpointsPassed,
  countPassedCheckpoints,
  extractPhaseChecks,
  getNextCheckpoint,
  getPhaseCheckState,
  isPassingScore,
  isPhaseCleared,
  PHASE_CHECK_PASS_MARK,
  PHASE_CHECK_QUESTIONS,
  withCheckAttempt,
  withPhaseChecks,
} from "./phaseCheck";

const step = (id: string, done: boolean): RoadmapStep => ({
  id,
  title: id,
  description: "",
  successCriteria: "",
  sessionsRequired: 4,
  sessionsCompleted: done ? 4 : 1,
  order: 0,
});

const phase = (
  id: string,
  stepsDone: boolean[],
  check?: RoadmapPhase["check"],
): RoadmapPhase => ({
  id,
  title: id,
  order: 0,
  steps: stepsDone.map((done, index) => step(`${id}-s${index}`, done)),
  ...(check ? { check } : {}),
});

const passed = {
  passedAt: "2026-09-01T00:00:00.000Z",
  attempts: 1,
  bestScore: 6,
  total: 6,
};

describe("getPhaseCheckState", () => {
  it("is locked while any step of the phase is still open", () => {
    expect(getPhaseCheckState(phase("p", [true, false]))).toBe("locked");
  });

  it("is locked for a phase with no steps at all", () => {
    expect(getPhaseCheckState(phase("p", []))).toBe("locked");
  });

  it("is ready once every step is done and the quiz not passed", () => {
    expect(getPhaseCheckState(phase("p", [true, true]))).toBe("ready");
  });

  it("is passed whenever a passing attempt was recorded, even if a step is reopened", () => {
    expect(getPhaseCheckState(phase("p", [true, false], passed))).toBe(
      "passed",
    );
  });
});

describe("isPhaseCleared", () => {
  it("needs both the steps and the checkpoint", () => {
    expect(isPhaseCleared(phase("p", [true, true]))).toBe(false);
    expect(isPhaseCleared(phase("p", [true, false], passed))).toBe(false);
    expect(isPhaseCleared(phase("p", [true, true], passed))).toBe(true);
  });
});

describe("getNextCheckpoint", () => {
  it("points at the first phase whose steps are done and whose quiz is not", () => {
    const phases = [
      phase("p1", [true, true], passed),
      phase("p2", [true, true]),
      phase("p3", [true, true]),
    ];
    expect(getNextCheckpoint(phases)?.phaseIdx).toBe(1);
  });

  it("is null when nothing is waiting", () => {
    expect(
      getNextCheckpoint([
        phase("p1", [true, true], passed),
        phase("p2", [true, false]),
      ]),
    ).toBeNull();
  });
});

describe("isPassingScore", () => {
  it("passes at the pass mark and above", () => {
    expect(isPassingScore(PHASE_CHECK_PASS_MARK, PHASE_CHECK_QUESTIONS)).toBe(
      true,
    );
    expect(isPassingScore(PHASE_CHECK_QUESTIONS, PHASE_CHECK_QUESTIONS)).toBe(
      true,
    );
  });

  it("fails below the pass mark", () => {
    expect(
      isPassingScore(PHASE_CHECK_PASS_MARK - 1, PHASE_CHECK_QUESTIONS),
    ).toBe(false);
  });

  it("caps the pass mark at the quiz's size for a short quiz", () => {
    expect(isPassingScore(3, 3)).toBe(true);
    expect(isPassingScore(0, 0)).toBe(false);
  });
});

describe("withCheckAttempt", () => {
  it("records a first pass with the time and the score", () => {
    const next = withCheckAttempt(
      phase("p", [true]),
      5,
      6,
      "2026-09-22T10:00:00.000Z",
    );
    expect(next.check).toEqual({
      passedAt: "2026-09-22T10:00:00.000Z",
      attempts: 1,
      bestScore: 5,
      total: 6,
    });
  });

  it("counts a failed attempt without passing", () => {
    const next = withCheckAttempt(phase("p", [true]), 2, 6);
    expect(next.check?.passedAt).toBeNull();
    expect(next.check?.attempts).toBe(1);
    expect(next.check?.bestScore).toBe(2);
  });

  it("keeps the first pass and the best score across later attempts", () => {
    const first = withCheckAttempt(
      phase("p", [true]),
      6,
      6,
      "2026-09-01T00:00:00.000Z",
    );
    const retake = withCheckAttempt(first, 3, 6, "2026-09-02T00:00:00.000Z");
    expect(retake.check).toEqual({
      passedAt: "2026-09-01T00:00:00.000Z",
      attempts: 2,
      bestScore: 6,
      total: 6,
    });
  });
});

describe("extractPhaseChecks / withPhaseChecks", () => {
  it("round-trips the results through the stored map", () => {
    const phases = [phase("p1", [true], passed), phase("p2", [false])];
    const stored = extractPhaseChecks(phases);
    expect(stored).toEqual({ p1: passed });

    const restored = withPhaseChecks(
      [phase("p1", [true]), phase("p2", [false])],
      stored,
    );
    expect(restored[0].check).toEqual(passed);
    expect(restored[1].check).toBeUndefined();
  });

  it("leaves phases untouched with no stored results", () => {
    const phases = [phase("p1", [true])];
    expect(withPhaseChecks(phases, undefined)).toEqual(phases);
  });
});

describe("countPassedCheckpoints / allCheckpointsPassed", () => {
  it("counts passes and demands every phase for the full set", () => {
    const phases = [phase("p1", [true], passed), phase("p2", [true])];
    expect(countPassedCheckpoints(phases)).toBe(1);
    expect(allCheckpointsPassed(["p1", "p2"], { p1: passed })).toBe(false);
    expect(allCheckpointsPassed(["p1"], { p1: passed })).toBe(true);
    expect(allCheckpointsPassed([], {})).toBe(false);
  });
});
