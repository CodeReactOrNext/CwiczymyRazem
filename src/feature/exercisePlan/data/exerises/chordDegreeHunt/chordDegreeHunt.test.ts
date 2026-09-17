import { NOTES } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { chordDegreeHuntSeventhsExercise } from "./chordDegreeHuntSevenths";
import { chordDegreeHuntTensionsExercise } from "./chordDegreeHuntTensions";
import { chordDegreeHuntTriadsExercise } from "./chordDegreeHuntTriads";
import type { ChordDegree } from "./createChordDegreeHuntExercise";
import { chordDegreeRounds, degreeAnswerCaption, degreeLabel } from "./createChordDegreeHuntExercise";

const exercises = [
  chordDegreeHuntTriadsExercise,
  chordDegreeHuntSeventhsExercise,
  chordDegreeHuntTensionsExercise,
];

describe("chord degree rounds", () => {
  // The whole point of the drill: the prompt looks the same for both chords, so
  // the answer can only come from reading the quality off the symbol.
  it("answers the same degree differently depending on the chord's quality", () => {
    const third = (chord: string) => chordDegreeRounds([chord], ["3"])[0].target;
    expect(third("Am")).toBe("C");
    expect(third("A")).toBe("C#");

    const seventh = (chord: string) => chordDegreeRounds([chord], ["7"])[0].target;
    expect(seventh("Cmaj7")).toBe("B");
    expect(seventh("C7")).toBe("A#");
  });

  it("flattens the 5th where the chord does", () => {
    expect(chordDegreeRounds(["Bm7b5"], ["5"])[0].target).toBe("F");
    expect(chordDegreeRounds(["Bm7"], ["5"])[0].target).toBe("F#");
  });

  it("skips degrees a chord doesn't have", () => {
    expect(chordDegreeRounds(["Am"], ["3", "5", "7"]).map((r) => r.degree)).toEqual(["3", "5"]);
  });

  // A natural 11th a semitone above a major 3rd is the avoid note; a minor chord
  // takes it happily but has no 13th on offer here.
  it("only offers the tensions that fit the chord", () => {
    expect(chordDegreeRounds(["Dm7"], ["9", "11", "13"]).map((r) => r.degree)).toEqual(["9", "11"]);
    expect(chordDegreeRounds(["G7"], ["9", "11", "13"]).map((r) => r.degree)).toEqual(["9", "13"]);
    expect(chordDegreeRounds(["Cmaj7"], ["9", "11", "13"]).map((r) => r.degree)).toEqual(["9", "13"]);
  });

  it("places the tensions an octave down from their names", () => {
    expect(chordDegreeRounds(["C7"], ["9"])[0].target).toBe("D");
    expect(chordDegreeRounds(["Dm7"], ["11"])[0].target).toBe("G");
    expect(chordDegreeRounds(["C7"], ["13"])[0].target).toBe("A");
  });
});

describe("degree labels", () => {
  const label = (chord: string, degree: "3" | "5" | "7" | "9" | "11" | "13", style: "ordinal" | "function") =>
    degreeLabel(chordDegreeRounds([chord], [degree])[0], style);

  // The ordinal keeps the quality hidden — that's the deduction the drill tests.
  it("names chord tones by ordinal without giving the quality away", () => {
    expect(label("Am", "3", "ordinal")).toBe("3rd");
    expect(label("A", "3", "ordinal")).toBe("3rd");
    expect(label("C7", "7", "ordinal")).toBe("7th");
  });

  // The function label states it, so the work moves to the neck.
  it("names chord tones by chromatic function when asked to", () => {
    expect(label("Am", "3", "function")).toBe("♭3");
    expect(label("A", "3", "function")).toBe("3");
    expect(label("C7", "7", "function")).toBe("♭7");
    expect(label("Cmaj7", "7", "function")).toBe("7");
    expect(label("Bm7b5", "5", "function")).toBe("♭5");
  });

  it("leaves tensions named by their function in both styles", () => {
    expect(label("C7", "9", "function")).toBe("9");
    expect(label("C7", "9", "ordinal")).toBe("9th");
  });
});

describe("chord degree hunt drills", () => {
  it.each(exercises.map((e) => [e.title, e] as const))(
    "%s is a mic-answered prompt hunt",
    (_title, exercise) => {
      expect(exercise.noteHuntConfig?.mode).toBe("interval");
      expect(exercise.disableMic).toBeUndefined();
      // The prompt carries the chord; the answer stays hidden in customGoal.
      expect(exercise.customGoalPrompt?.title).toBeTruthy();
      expect(exercise.customGoalPrompt?.subtitle).toBeTruthy();
      expect(NOTES).toContain(exercise.customGoal);
    },
  );

  it.each(exercises.map((e) => [e.title, e] as const))(
    "%s rolls answerable rounds",
    (_title, exercise) => {
      for (let i = 0; i < 60; i++) {
        const rolled = exercise.rollHuntTarget!();
        expect(rolled.prompt?.title).toBeTruthy();
        expect(rolled.prompt?.subtitle).toBeTruthy();
        expect(NOTES).toContain(rolled.goal);
      }
    },
  );

  // The beginner variant is the one that waits; the harder two keep the clock,
  // and a countdown of 0 with a timer would freeze on the first target forever.
  it("pairs the wait-for-answer pacing with no countdown, and only there", () => {
    expect(chordDegreeHuntTriadsExercise.noteHuntConfig).toEqual({
      rotateSeconds: 0,
      mode: "interval",
      advanceOn: "solved",
    });
    for (const exercise of [chordDegreeHuntSeventhsExercise, chordDegreeHuntTensionsExercise]) {
      expect(exercise.noteHuntConfig?.advanceOn).toBe("timer");
      expect(exercise.noteHuntConfig!.rotateSeconds).toBeGreaterThan(0);
    }
  });

  it("asks the beginner variant in functions and the rest in ordinals", () => {
    expect(chordDegreeHuntTriadsExercise.customGoalPrompt!.subtitle).toMatch(/^[♭♯]?\d$/);
    expect(chordDegreeHuntSeventhsExercise.customGoalPrompt!.subtitle).toMatch(/^\d+(st|nd|rd|th)$/);
    expect(chordDegreeHuntTensionsExercise.customGoalPrompt!.subtitle).toMatch(/^\d+(st|nd|rd|th)$/);
  });

  it("never repeats the same chord+degree pair twice in a row", () => {
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      const rolled = chordDegreeHuntTriadsExercise.rollHuntTarget!();
      seen.push(`${rolled.prompt!.title}-${rolled.prompt!.subtitle}`);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });
});

describe("answer caption", () => {
  const round = (chord: string, degree: ChordDegree) => chordDegreeRounds([chord], [degree])[0];

  // The question players keep asking: "E7 · 7th" wants D, and D is a minor 7th.
  // The prompt stays an ordinal on purpose — reading the quality off the symbol
  // is the drill — but once the answer is on screen the caption says both.
  it("names an ordinal degree in chromatic shorthand once the answer is revealed", () => {
    expect(degreeAnswerCaption(round("E7", "7"), "ordinal")).toBe("7th · ♭7");
    expect(degreeAnswerCaption(round("Am7", "3"), "ordinal")).toBe("3rd · ♭3");
    expect(degreeAnswerCaption(round("Bm7b5", "5"), "ordinal")).toBe("5th · ♭5");
  });

  // "7th · 7" and "3rd · 3" teach nothing, and the drills that already ask in
  // functions have nothing left to translate.
  it("stays quiet where the two names would say the same thing", () => {
    expect(degreeAnswerCaption(round("Cmaj7", "7"), "ordinal")).toBeUndefined();
    expect(degreeAnswerCaption(round("C", "5"), "ordinal")).toBeUndefined();
    expect(degreeAnswerCaption(round("Am7", "9"), "ordinal")).toBeUndefined();
    expect(degreeAnswerCaption(round("Am", "3"), "function")).toBeUndefined();
  });

  it("calls the subject a chord, whatever the symbol looks like", () => {
    // A bare major triad is spelled like a note name, and the card used to read
    // "D · root" in a drill that is asking about the D chord.
    for (const exercise of exercises) {
      for (let i = 0; i < 20; i++) {
        expect(exercise.rollHuntTarget!().prompt?.subjectCaption).toBe("chord");
      }
    }
  });
});
