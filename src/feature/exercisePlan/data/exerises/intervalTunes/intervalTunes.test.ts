import { isAutoBackingEligible } from "feature/autoBacking/eligibility";
import { generateAutoBacking } from "feature/autoBacking/generateAutoBacking";
import { describe, expect, it } from "vitest";

import { intervalTuneExercises } from "./intervalTunes";

// Every tune is played over the generated band: none of them may opt out of it.
// The library-wide test in feature/autoBacking checks the band stays on the
// tab's clock for every eligible exercise, these included.
describe("interval tunes", () => {
  it.each(intervalTuneExercises.map((e) => [e.title, e] as const))("%s gets a generated backing", (_title, exercise) => {
    expect(isAutoBackingEligible(exercise)).toBe(true);
    const result = generateAutoBacking({
      measures: exercise.tablature!,
      bpm: exercise.metronomeSpeed!.recommended,
      title: exercise.title,
      description: exercise.description,
      seed: exercise.id,
    });
    expect(result?.tracks.length).toBeGreaterThan(0);
  });
});
