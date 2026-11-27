// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getFirstRiffExercise, LEVEL_OPTIONS } from "../data/onboardingGoals";
import { getRiffPreviewNotes, RiffPreview } from "./RiffPreview";

afterEach(cleanup);

describe("RiffPreview", () => {
  it("shows the beginner riff as open strings only, as its card promises", () => {
    const notes = getRiffPreviewNotes(getFirstRiffExercise("new"));
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((note) => note.label === "0")).toBe(true);
  });

  it.each(LEVEL_OPTIONS.map((option) => option.level))(
    "draws the start of the %s riff inside the picture",
    (level) => {
      const notes = getRiffPreviewNotes(getFirstRiffExercise(level));
      expect(notes.length).toBeGreaterThan(0);
      for (const note of notes) {
        expect(note.x).toBeLessThanOrEqual(330);
        expect(note.string).toBeGreaterThanOrEqual(1);
        expect(note.string).toBeLessThanOrEqual(6);
      }
    },
  );

  it("renders one pill per note", () => {
    const exercise = getFirstRiffExercise("new");
    const { container } = render(<RiffPreview exercise={exercise} />);
    expect(container.querySelectorAll("rect")).toHaveLength(
      getRiffPreviewNotes(exercise).length,
    );
  });
});
