import type { RequiredExercise } from "feature/scaleTree/types/scaleTree.types";
import { describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

vi.mock("utils/firebase/client/firestoreTracking", () => ({
  trackedGetDocs: vi.fn(),
}));

import { isExerciseCleared } from "./scaleTree.service";

const makeReq = (overrides: Partial<RequiredExercise> = {}): RequiredExercise => ({
  exerciseId: "scale_c_minor_pentatonic_ascending_pos1",
  requiredBpm: 95,
  scaleType: "minor_pentatonic",
  patternType: "ascending",
  position: 1,
  label: "Ascending – Box 1",
  ...overrides,
});

describe("isExerciseCleared", () => {
  it("clears an exercise once the current target BPM is reached", () => {
    expect(isExerciseCleared(makeReq(), [60, 95])).toBe(true);
    expect(isExerciseCleared(makeReq(), [120])).toBe(true);
  });

  it("does not clear an exercise below every known target", () => {
    expect(isExerciseCleared(makeReq({ legacyRequiredBpm: 80 }), [60, 70])).toBe(false);
    expect(isExerciseCleared(makeReq(), [])).toBe(false);
  });

  it("keeps progress made at the lower, pre-bump target", () => {
    expect(isExerciseCleared(makeReq({ legacyRequiredBpm: 80 }), [80])).toBe(true);
    expect(isExerciseCleared(makeReq({ legacyRequiredBpm: 70 }), [75])).toBe(true);
  });

  it("falls back to the current target when there is no legacy one", () => {
    expect(isExerciseCleared(makeReq(), [80])).toBe(false);
  });
});
