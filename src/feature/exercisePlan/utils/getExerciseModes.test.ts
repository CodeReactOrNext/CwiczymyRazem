import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { getExerciseModes } from "feature/exercisePlan/utils/getExerciseModes";
import { describe, expect, it } from "vitest";

const base = {
  metronomeSpeed: null,
  tablature: undefined,
  strummingPatterns: undefined,
  noteHuntConfig: undefined,
  earQuizConfig: undefined,
  riddleConfig: undefined,
  noGuitarNeeded: undefined,
};

describe("getExerciseModes", () => {
  it("reads a BPM ladder off metronomeSpeed", () => {
    const modes = getExerciseModes({ ...base, metronomeSpeed: { min: 40, max: 120, recommended: 80 } });
    expect(modes).toContain("bpm");
  });

  it("marks tab and strumming drills separately", () => {
    expect(getExerciseModes({ ...base, tablature: [{ beats: [], timeSignature: [4, 4] }] })).toContain("tab");
    expect(
      getExerciseModes({ ...base, strummingPatterns: [{ timeSignature: [4, 4], subdivisions: 2, strums: [] }] })
    ).toContain("strum");
  });

  it("marks click hunts as fretboard drills that need no guitar", () => {
    const modes = getExerciseModes({ ...base, noteHuntConfig: { rotateSeconds: 20, mode: "click" } });
    expect(modes).toContain("fretboard");
    expect(modes).toContain("noGuitar");
  });

  it("keeps mic-driven hunts out of the no-guitar list", () => {
    const modes = getExerciseModes({ ...base, noteHuntConfig: { rotateSeconds: 20, mode: "octaves" } });
    expect(modes).toContain("fretboard");
    expect(modes).not.toContain("noGuitar");
  });

  it("falls back to open practice when nothing is scored mechanically", () => {
    expect(getExerciseModes({ ...base })).toEqual(["open"]);
  });

  it("returns several modes for an exercise that is several things at once", () => {
    const modes = getExerciseModes({
      ...base,
      metronomeSpeed: { min: 40, max: 120, recommended: 80 },
      tablature: [{ beats: [], timeSignature: [4, 4] }],
    });
    expect(modes).toEqual(expect.arrayContaining(["bpm", "tab"]));
  });
});

describe("the real library", () => {
  const visible = exercisesAgregat.filter(e => !e.isHiddenFromLibrary && !e.isPlayalong);

  it("leaves no exercise without a mode, so nothing becomes unfilterable", () => {
    visible.forEach(e => expect(getExerciseModes(e).length).toBeGreaterThan(0));
  });

  it("matches the counts the browse filter advertises", () => {
    const count = (mode: string) => visible.filter(e => getExerciseModes(e).includes(mode as never)).length;
    expect(count("bpm")).toBe(154);
    expect(count("tab")).toBe(104);
    expect(count("strum")).toBe(34);
    expect(count("fretboard")).toBe(32);
    expect(count("ear")).toBe(8);
    expect(count("noGuitar")).toBe(30);
  });
});
