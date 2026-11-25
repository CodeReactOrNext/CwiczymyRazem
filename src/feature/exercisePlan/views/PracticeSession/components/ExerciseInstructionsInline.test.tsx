// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { afterEach, describe, expect, it } from "vitest";

import { ExerciseInstructionsInline } from "./ExerciseInstructionsInline";

afterEach(cleanup);

const exercise = {
  id: "scale",
  title: "Scale",
  difficulty: "easy",
  category: "theory",
  relatedSkills: [],
  instructions: ["Rest your hand.", "Climb up.", "Come back down."],
  tips: ["Pick alternately."],
  whyItMatters: "It is the sound of minor.",
} as unknown as Exercise;

describe("ExerciseInstructionsInline", () => {
  it("lists every step, the tips and why", () => {
    render(<ExerciseInstructionsInline exercise={exercise} />);
    expect(screen.getByText("Rest your hand.")).toBeDefined();
    expect(screen.getByText("Climb up.")).toBeDefined();
    expect(screen.getByText("Come back down.")).toBeDefined();
    expect(screen.getByText("Pick alternately.")).toBeDefined();
    expect(screen.getByText("It is the sound of minor.")).toBeDefined();
  });

  it("has no heading for what the exercise doesn't say", () => {
    render(<ExerciseInstructionsInline exercise={{ ...exercise, tips: [], whyItMatters: undefined } as unknown as Exercise} />);
    expect(screen.queryByText("Pro Tips")).toBeNull();
    expect(screen.queryByText("Why This Matters")).toBeNull();
  });
});
