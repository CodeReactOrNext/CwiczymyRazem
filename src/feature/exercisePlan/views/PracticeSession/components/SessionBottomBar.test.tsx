// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSessionTimeStore } from "../hooks/sessionTimeStore";
import { SessionBottomBar } from "./SessionBottomBar";

vi.mock("./SessionTransport", () => ({ SessionTransport: () => null }));
vi.mock("./ShortcutsLegend", () => ({ ShortcutsDialog: () => null }));

afterEach(() => {
  cleanup();
  useSessionTimeStore.getState().reset();
});

const renderBar = (overrides: Partial<Parameters<typeof SessionBottomBar>[0]> = {}) => {
  const onClose = vi.fn();
  render(
    <SessionBottomBar
      onClose={onClose}
      currentExercise={{ id: "ex", title: "Ex", metronomeSpeed: null } as unknown as Exercise}
      isLastExercise={false}
      isPlaying={false}
      toggleTimer={vi.fn()}
      handleRestart={vi.fn()}
      handleNextExerciseClick={vi.fn()}
      canFinishSession={false}
      hasLoggedPractice={false}
      currentExerciseIndex={0}
      totalExercises={1}
      onGoToPreviousExercise={vi.fn()}
      isSubmittingReport={false}
      onFinishSession={vi.fn()}
      {...overrides}
    />,
  );
  return { onClose };
};

const clickExit = () => fireEvent.click(screen.getAllByRole("button")[0]);

describe("SessionBottomBar verdict", () => {
  it("answers a finished run in place of the transport, with the way out kept", () => {
    renderBar({ totalExercises: 4, verdict: { tone: "good", strip: <p>Clean run</p> } });
    expect(screen.getByText("Clean run")).toBeDefined();
    expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

describe("SessionBottomBar exit", () => {
  it("leaves straight away when nothing was practised yet", () => {
    const { onClose } = renderBar();

    clickExit();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Leave the session?")).toBeNull();
  });

  it("below the save threshold offers only Exit and Stay, no disabled save", () => {
    useSessionTimeStore.getState().add("technique", 5000);
    const { onClose } = renderBar();

    clickExit();

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Leave the session?")).toBeDefined();
    expect(screen.getByRole("button", { name: /stay in session/i })).toBeDefined();
    expect(screen.queryByRole("button", { name: /finish & save time/i })).toBeNull();
  });

  it("with logged practice offers saving next to Stay and Exit", () => {
    useSessionTimeStore.getState().add("technique", 30000);
    renderBar({ hasLoggedPractice: true, canFinishSession: true });

    clickExit();

    expect(screen.getByRole("button", { name: /finish & save time/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /stay in session/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /exit without saving/i })).toBeDefined();
  });

  it("opens with focus on Stay, so Enter never drops the session", () => {
    useSessionTimeStore.getState().add("technique", 30000);
    renderBar({ hasLoggedPractice: true, canFinishSession: true });

    clickExit();

    expect(document.activeElement).toBe(screen.getByRole("button", { name: /stay in session/i }));
  });
});

describe("SessionBottomBar moving on", () => {
  it("says what Next leads to, and turns white once the clock is down", () => {
    renderBar({ totalExercises: 3, nextTitle: "Spider walk" });
    const quiet = screen.getByRole("button", { name: /spider walk/i });
    expect(quiet.className).not.toContain("bg-primary");

    cleanup();
    renderBar({ totalExercises: 3, nextTitle: "Spider walk", isTimeUp: true });
    expect(screen.getByRole("button", { name: /spider walk/i }).className).toContain("bg-primary");
  });

  it("offers Finish only once there is something to save", () => {
    renderBar({ isLastExercise: true });
    expect(screen.queryByRole("button", { name: /finish session/i })).toBeNull();

    cleanup();
    renderBar({ isLastExercise: true, hasLoggedPractice: true });
    expect(screen.getByRole("button", { name: /finish session/i }).className).not.toContain("bg-primary");

    cleanup();
    renderBar({ isLastExercise: true, hasLoggedPractice: true, canFinishSession: true });
    expect(screen.getByRole("button", { name: /finish session/i }).className).toContain("bg-primary");
  });

  it("has neither in an exam", () => {
    renderBar({ examMode: true, isLastExercise: true, hasLoggedPractice: true });
    expect(screen.queryByRole("button", { name: /finish session|next/i })).toBeNull();
  });
});
