// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSessionTimeStore } from "../hooks/sessionTimeStore";
import { SessionBottomBar } from "./SessionBottomBar";

vi.mock("./MainTimerSection", () => ({ MainTimerSection: () => null, default: () => null }));
vi.mock("./ShortcutsLegend", () => ({ ShortcutsLegend: () => null }));

afterEach(() => {
  cleanup();
  useSessionTimeStore.getState().reset();
});

const renderBar = (overrides: Partial<Parameters<typeof SessionBottomBar>[0]> = {}) => {
  const onClose = vi.fn();
  render(
    <SessionBottomBar
      onClose={onClose}
      exerciseKey={0}
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
