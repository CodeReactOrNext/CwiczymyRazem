import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { EarQuizConfig } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import { afterEach, describe, expect, it } from "vitest";

import { EarQuizPanel } from "./EarQuizPanel";

// jsdom has no Web Audio, so every playback call short-circuits to a no-op —
// which is exactly what these tests want: the answer flow, not the sound.

const CHORD_CONFIG: EarQuizConfig = { mode: "chordType", qualities: ["major", "minor", "dom7", "sus4"] };

const button = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;

describe("EarQuizPanel — chord quality", () => {
  afterEach(cleanup);

  it("offers every configured quality and grades the pick", () => {
    render(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_chord_quiz' />);

    expect(screen.getByText("What kind of chord is this?")).toBeDefined();
    ["Major", "Minor", "Dominant 7", "Sus4"].forEach((label) => {
      expect(button(new RegExp(label))).toBeDefined();
    });

    fireEvent.click(button(/Major/));

    // The round is settled: a verdict with a way onwards, and the formula of the
    // chord that actually played is now on screen.
    expect(button(/Next/)).toBeDefined();
    expect(screen.getAllByText(/1 · (3|♭3|4) · 5/).length).toBeGreaterThan(0);
  });

  it("takes one answer per round, then starts a clean one", () => {
    render(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_chord_quiz' />);

    fireEvent.click(button(/Major/));

    // Every option is locked once the verdict is in — no second guess.
    ["Major", "Minor", "Dominant 7", "Sus4"].forEach((label) => {
      expect(button(new RegExp(label)).disabled).toBe(true);
    });

    fireEvent.click(button(/Next/));

    expect(screen.queryByRole("button", { name: /Next/ })).toBeNull();
    expect(button(/Major/).disabled).toBe(false);
    expect(screen.getByText("What kind of chord is this?")).toBeDefined();
  });
});

describe("EarQuizPanel — progressions", () => {
  afterEach(cleanup);

  const config: EarQuizConfig = {
    mode: "progression",
    progressions: ["I-IV-V"],
    degreePool: ["I", "IV", "V", "vi"],
  };

  it("builds the answer from tiles and only checks once it is complete", () => {
    render(<EarQuizPanel config={config} exerciseId='test_progression_quiz' />);

    expect(button("Check").disabled).toBe(true);

    fireEvent.click(button("Imajor"));
    fireEvent.click(button("IVmajor"));
    expect(button("Check").disabled).toBe(true); // still a slot short

    fireEvent.click(button("Vmajor"));
    expect(button("Check").disabled).toBe(false);

    fireEvent.click(button("Check"));

    expect(screen.getByText("I – IV – V")).toBeDefined();
    expect(button(/Next/)).toBeDefined();
  });

  it("clears a filled slot when it is tapped", () => {
    render(<EarQuizPanel config={config} exerciseId='test_progression_quiz' />);

    fireEvent.click(button("Imajor"));
    fireEvent.click(button(/Slot 1: I, tap to clear/));

    expect(screen.getByLabelText("Slot 1: empty")).toBeDefined();
    expect(button("Check").disabled).toBe(true);
  });
});
