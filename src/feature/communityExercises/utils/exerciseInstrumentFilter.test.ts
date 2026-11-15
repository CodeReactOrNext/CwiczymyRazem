import { describe, expect, it } from "vitest";

import { getExerciseInstrumentKind, matchesInstrumentFilter } from "./exerciseInstrumentFilter";

describe("getExerciseInstrumentKind", () => {
  it("treats a missing instrument and tuning as six-string guitar", () => {
    expect(getExerciseInstrumentKind({})).toBe("guitar");
    expect(getExerciseInstrumentKind({ tuningId: "drop-d" })).toBe("guitar");
  });

  it("recognises a seven-string tuning", () => {
    expect(getExerciseInstrumentKind({ tuningId: "seven-standard" })).toBe("seven");
    expect(getExerciseInstrumentKind({ instrument: "guitar", tuningId: "seven-drop-a" })).toBe("seven");
  });

  it("recognises bass, including five-string", () => {
    expect(getExerciseInstrumentKind({ instrument: "bass" })).toBe("bass");
    expect(getExerciseInstrumentKind({ instrument: "bass", tuningId: "bass-5-standard" })).toBe("bass");
  });
});

describe("matchesInstrumentFilter", () => {
  it("lets everything through on all", () => {
    expect(matchesInstrumentFilter({ instrument: "bass" }, "all")).toBe(true);
  });

  it("keeps only the chosen instrument", () => {
    expect(matchesInstrumentFilter({ tuningId: "seven-standard" }, "seven")).toBe(true);
    expect(matchesInstrumentFilter({ tuningId: "seven-standard" }, "guitar")).toBe(false);
    expect(matchesInstrumentFilter({ instrument: "bass" }, "seven")).toBe(false);
  });
});
