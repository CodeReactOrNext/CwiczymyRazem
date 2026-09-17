// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useNoteHunt } from "./useNoteHunt";

// The prompt drills ("the 7th of E7") hide the answer and take one note for it.
// Everything below is about the difference between grading that and grading an
// octave hunt, because grading the wrong one is exactly what made these drills
// report 0% / 25% forever: a perfect answer counted as one of the four-or-five
// playable octaves of the note, and the count reset on every rotation.
//
// Driven through markOctave rather than the mic: it is the same found-set and
// scoring path the detector feeds, minus the RAF loop and a fake pitch stream.
const setup = (roundGraded: boolean, note = "D") =>
  renderHook(
    ({ target }) => useNoteHunt(target, undefined, undefined, false, undefined, undefined, 0, roundGraded),
    { initialProps: { target: note } },
  );

describe("useNoteHunt — prompt drills (round-graded)", () => {
  it("counts one answered round as a whole correct answer, not one octave of it", () => {
    const { result } = setup(true);
    expect(result.current.state.accuracy).toBe(0);

    act(() => result.current.markOctave(3));
    expect(result.current.state.accuracy).toBe(100);
    expect(result.current.state.rounds).toEqual({ solved: 0, presented: 1 });
  });

  it("does not pay twice for the same round found in a second octave", () => {
    const { result } = setup(true);

    act(() => result.current.markOctave(3));
    const afterOne = result.current.state.gameState.score;
    act(() => result.current.markOctave(4));

    expect(result.current.state.gameState.score).toBe(afterOne);
    expect(result.current.state.accuracy).toBe(100);
  });

  it("carries the tally across rotations instead of resetting it", () => {
    const { result, rerender } = setup(true);

    act(() => result.current.markOctave(3));
    rerender({ target: "E" });

    // Second round up, first one banked: the grade counts the question on screen,
    // so it reads 1 of 2 until this one is answered too.
    expect(result.current.state.rounds).toEqual({ solved: 1, presented: 2 });
    expect(result.current.state.accuracy).toBe(50);

    act(() => result.current.markOctave(4));
    expect(result.current.state.accuracy).toBe(100);
    expect(result.current.state.maxCombo).toBe(2);
  });

  it("charges for a round that rotated away unanswered", () => {
    const { result, rerender } = setup(true);

    act(() => result.current.markOctave(3));
    rerender({ target: "E" });
    rerender({ target: "F" });

    expect(result.current.state.rounds).toEqual({ solved: 1, presented: 3 });
    expect(result.current.state.accuracy).toBe(33);
  });

  it("scales the ceiling with the rounds asked, so score and max stay comparable", () => {
    const { result, rerender } = setup(true);

    act(() => result.current.markOctave(3));
    rerender({ target: "E" });
    act(() => result.current.markOctave(4));

    // Every round answered => the run IS the maximum. The mobile HUD prints the
    // two side by side, and the exam pass bar is a percentage of the max.
    expect(result.current.state.gameState.score).toBe(result.current.state.maxPossibleScore);
  });
});

describe("useNoteHunt — octave hunts (unchanged)", () => {
  it("still grades by octave, out of every octave on the neck", () => {
    const { result } = setup(false);
    // D is reachable in four octaves, so one of them is a quarter of the goal —
    // which is the right answer to a question that asks for all four.
    expect(result.current.state.octaves).toHaveLength(4);

    act(() => result.current.markOctave(3));
    expect(result.current.state.accuracy).toBe(25);
    expect(result.current.state.rounds).toBeNull();
  });
});

describe("useNoteHunt — a new question on the same note", () => {
  // "the ♭3 of Am" and "the 5th of F" are both C. Keyed on the note alone, the
  // second question opened with the first one's answer already on screen — and
  // the round it should have been was never counted.
  const setupKeyed = (roundKey: string) =>
    renderHook(
      ({ key }) => useNoteHunt("C", undefined, undefined, false, undefined, undefined, 0, true, key),
      { initialProps: { key: roundKey } },
    );

  it("starts over when the question changes but the answer doesn't", () => {
    const { result, rerender } = setupKeyed("Am|♭3");

    act(() => result.current.markOctave(3));
    expect(result.current.state.foundOctaves).toEqual([3]);

    rerender({ key: "F|5" });
    expect(result.current.state.foundOctaves).toEqual([]);
    expect(result.current.state.rounds).toEqual({ solved: 1, presented: 2 });
  });
});
