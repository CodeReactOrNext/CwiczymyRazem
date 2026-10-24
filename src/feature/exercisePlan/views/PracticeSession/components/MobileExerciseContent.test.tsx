// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { oneStringBackingExercise } from "feature/exercisePlan/data/exerises/oneStringBacking/oneStringBacking";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionUIProvider } from "../contexts/SessionUIContext";
import { MobileExerciseContent } from "./MobileExerciseContent";

afterEach(cleanup);

describe("MobileExerciseContent", () => {
  it("shows the backing-track picker for an improv exercise with nothing else to show", () => {
    render(
      <SessionUIProvider>
        <MobileExerciseContent
          currentExercise={oneStringBackingExercise}
          metronome={{ bpm: 80, isPlaying: false }}
          isPlaying={false}
          isListening={false}
          tabResetKey={0}
          setVideoDuration={vi.fn()}
          setTimerTime={vi.fn()}
          startTimer={vi.fn()}
          stopTimer={vi.fn()}
          onVideoEnd={vi.fn()}
          onPlayRiddle={vi.fn()}
        />
      </SessionUIProvider>,
    );
    expect(screen.getByRole("button")).toBeTruthy();
  });
});
