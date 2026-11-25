// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { EarQuizConfig } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEarQuizRunStore } from "../../helpers/earQuizRunStore";
import { useEarQuizVerdictStore } from "../../helpers/earQuizVerdictStore";
import { EarQuizPanel } from "./EarQuizPanel";

// jsdom has no Web Audio, so every playback call short-circuits to a no-op —
// which is exactly what these tests want: the answer flow, not the sound.

// Radix's slider (the tuning quiz) measures its thumb on mount.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const CHORD_CONFIG: EarQuizConfig = {
  mode: "chordType",
  qualities: ["major", "minor", "dom7", "sus4"],
};

const button = (name: string | RegExp) =>
  screen.getByRole("button", { name }) as HTMLButtonElement;

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
    expect(button(/Continue/)).toBeDefined();
    expect(screen.getAllByText(/1 · (3|♭3|4) · 5/).length).toBeGreaterThan(0);
  });

  it("takes one answer per round, then starts a clean one", () => {
    render(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_chord_quiz' />);

    fireEvent.click(button(/Major/));
    const verdict = screen.getByText(
      / — (Major|Minor|Dominant 7|Sus4)$/,
    ).textContent;

    // Once the verdict is in, the options turn into players for comparison —
    // tapping another one plays it instead of taking a second guess.
    fireEvent.click(button(/Hear Minor from/));
    fireEvent.click(button(/Hear Sus4 from/));

    expect(
      screen.getByText(/ — (Major|Minor|Dominant 7|Sus4)$/).textContent,
    ).toBe(verdict);

    fireEvent.click(button(/Continue/));

    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Hear Major from/ }),
    ).toBeNull();
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

    fireEvent.click(button(/I\s*major/));
    fireEvent.click(button(/IV\s*major/));
    expect(button("Check").disabled).toBe(true); // still a slot short

    fireEvent.click(button(/^\d?\s*V\s*major/));
    expect(button("Check").disabled).toBe(false);

    fireEvent.click(button("Check"));

    expect(screen.getByText("I – IV – V")).toBeDefined();
    expect(button(/Continue/)).toBeDefined();
  });

  it("clears a filled slot when it is tapped", () => {
    render(<EarQuizPanel config={config} exerciseId='test_progression_quiz' />);

    fireEvent.click(button(/I\s*major/));
    fireEvent.click(button(/Slot 1: I, tap to clear/));

    expect(screen.getByLabelText("Slot 1: empty")).toBeDefined();
    expect(button("Check").disabled).toBe(true);
  });
});

describe("EarQuizPanel — tuning by ear", () => {
  afterEach(cleanup);

  const config: EarQuizConfig = {
    mode: "detune",
    toleranceCents: 8,
    minOffsetCents: 20,
    maxOffsetCents: 40,
  };

  it("keeps the error hidden until the answer is in", () => {
    render(<EarQuizPanel config={config} exerciseId='test_detune_quiz' />);

    expect(screen.getByText(/trust your ears/)).toBeDefined();

    // Leaving the slider where it started is always outside the window here,
    // since the question is drawn at least 20 cents out.
    fireEvent.click(button(/in tune/));

    expect(screen.getByText(/cents$/)).toBeDefined();
    expect(screen.getByText(/cents (sharp|flat) —/)).toBeDefined();
    expect(button(/Continue/)).toBeDefined();
  });
});

describe("EarQuizPanel — scales and modes", () => {
  afterEach(cleanup);

  const config: EarQuizConfig = {
    mode: "scaleMode",
    scales: ["ionian", "aeolian", "dorian"],
  };

  it("offers each mode and reveals the formula of the one that played", () => {
    render(<EarQuizPanel config={config} exerciseId='test_mode_quiz' />);

    fireEvent.click(button(/Dorian/));

    expect(button(/Continue/)).toBeDefined();
    expect(screen.getByText(/Listen for the .+ — 1 /)).toBeDefined();

    // Every mode can now be heard from the same root, Dorian included.
    expect(button(/Hear Aeolian .* from/)).toBeDefined();
  });
});

describe("EarQuizPanel — intervals", () => {
  afterEach(cleanup);

  const config: EarQuizConfig = {
    mode: "interval",
    intervals: ["m3", "M3", "P5"],
    directions: ["ascending"],
  };

  it("offers each interval, grades the pick and lets every one be heard after", () => {
    render(<EarQuizPanel config={config} exerciseId='test_interval_quiz' />);

    fireEvent.click(button(/Perfect 5th/));

    expect(button(/Continue/)).toBeDefined();
    expect(screen.getByText(/frets? from .+ on one string/)).toBeDefined();

    expect(button(/Hear Minor 3rd from/)).toBeDefined();
  });
});

describe("EarQuizPanel — the run", () => {
  afterEach(() => {
    cleanup();
    useEarQuizRunStore.getState().reset();
  });

  it("counts answers only while the session runs", () => {
    const { rerender } = render(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_run' isSessionRunning={false} />);
    fireEvent.click(button(/Major/));
    expect(useEarQuizRunStore.getState().answered).toBe(0);

    fireEvent.click(button(/Continue/));
    rerender(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_run' isSessionRunning />);
    fireEvent.click(button(/Major/));
    expect(useEarQuizRunStore.getState().answered).toBe(1);
  });

  it("answers from the number keys while it runs, and not under the start gate", () => {
    const { rerender } = render(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_keys' isSessionRunning={false} />);
    fireEvent.keyDown(window, { key: "2" });
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();

    rerender(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_keys' isSessionRunning />);
    fireEvent.keyDown(window, { key: "2" });
    expect(button(/Continue/)).toBeDefined();
  });

  it("takes the verdict down with the panel", () => {
    render(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_unmount' isSessionRunning />);
    fireEvent.click(button(/Major/));
    expect(useEarQuizVerdictStore.getState().isShown).toBe(true);
    cleanup();
    expect(useEarQuizVerdictStore.getState().isShown).toBe(false);
  });

  it("says the verdict in the question's place and reports Continue", () => {
    const onContinue = vi.fn();
    render(<EarQuizPanel config={CHORD_CONFIG} exerciseId='test_continue' isSessionRunning onContinue={onContinue} />);
    fireEvent.click(button(/Major/));
    expect(document.activeElement).toBe(button(/Continue/));
    expect(screen.getByText("What kind of chord is this?").closest(".invisible")).not.toBeNull();

    fireEvent.click(button(/Continue/));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(useEarQuizVerdictStore.getState().isShown).toBe(false);
    expect(screen.getByText("What kind of chord is this?").closest(".invisible")).toBeNull();
  });
});
