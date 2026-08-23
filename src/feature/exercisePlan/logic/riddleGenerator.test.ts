import type { SequenceRepeatRiddleConfig } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { generateRiddle } from "./riddleGenerator";

const config = (over: Partial<SequenceRepeatRiddleConfig> = {}): SequenceRepeatRiddleConfig => ({
  mode: "sequenceRepeat",
  difficulty: "easy",
  noteCount: 2,
  range: { minFret: 0, maxFret: 5, strings: [1, 2] },
  ...over,
});

const beatsOf = (measures: ReturnType<typeof generateRiddle>) => measures.flatMap(m => m.beats);
const soundedBeats = (measures: ReturnType<typeof generateRiddle>) =>
  beatsOf(measures).filter(b => b.notes.length > 0);

describe("generateRiddle", () => {
  it("plays exactly the requested number of notes", () => {
    expect(soundedBeats(generateRiddle(config())).length).toBe(2);
    expect(soundedBeats(generateRiddle(config({ noteCount: 6, difficulty: "hard" }))).length).toBe(6);
  });

  it("keeps every note inside the configured range", () => {
    for (let i = 0; i < 50; i++) {
      for (const beat of soundedBeats(generateRiddle(config()))) {
        const note = beat.notes[0];
        expect([1, 2]).toContain(note.string);
        expect(note.fret).toBeGreaterThanOrEqual(0);
        expect(note.fret).toBeLessThanOrEqual(5);
      }
    }
  });

  it("fills whole bars, so the phrase ends on its last note instead of a silent bar", () => {
    // The answer matcher only arms once playback has gone quiet, so a trailing
    // empty bar is dead air the player would try to answer into.
    for (const noteCount of [2, 4, 6]) {
      const measures = generateRiddle(config({ noteCount }));
      expect(measures.every(m => m.beats.length === 4)).toBe(true);
      expect(measures.length).toBe(Math.ceil(noteCount / 4));
      // Padding rests only ever come after the notes.
      const notes = beatsOf(measures).map(b => b.notes.length > 0);
      expect(notes.lastIndexOf(true)).toBe(noteCount - 1);
    }
  });

  it("pads the last bar with independent rest beats", () => {
    const measures = generateRiddle(config({ noteCount: 2 }));
    const rests = beatsOf(measures).filter(b => b.notes.length === 0);
    expect(rests.length).toBe(2);
    // Distinct objects: a shared rest instance would be mutated for every copy.
    expect(rests[0]).not.toBe(rests[1]);
  });

  it("keeps medium riddles playable — no wild jumps between consecutive notes", () => {
    for (let i = 0; i < 50; i++) {
      const notes = soundedBeats(
        generateRiddle(config({ difficulty: "medium", noteCount: 4, range: { minFret: 0, maxFret: 12, strings: [1, 2, 3] } })),
      ).map(b => b.notes[0]);
      for (let n = 1; n < notes.length; n++) {
        expect(Math.abs(notes[n].string - notes[n - 1].string)).toBeLessThanOrEqual(1);
        expect(Math.abs(notes[n].fret - notes[n - 1].fret)).toBeLessThanOrEqual(3);
      }
    }
  });
});
