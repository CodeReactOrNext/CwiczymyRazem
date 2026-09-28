// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { useTimerInterface } from "hooks/useTimer";
import { afterEach, describe, expect, it, vi } from "vitest";

import TimerLayout from "./TimerLayout";

vi.mock("feature/toneStudio/components/AmpSimButton", () => ({ AmpSimButton: () => null }));
vi.mock("./components/FreeTimerMetronome", () => ({ default: () => null }));
vi.mock("./components/FreeTimerIntervalAlert", () => ({ default: () => null }));
vi.mock("./components/CategoryBox", () => ({ default: () => null }));

afterEach(cleanup);

const makeTimer = (timerEnabled = false) =>
  ({
    timerEnabled,
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    getTime: () => 0,
    subscribe: () => () => {},
  }) as unknown as useTimerInterface;

const zero = { technique: 0, theory: 0, hearing: 0, creativity: 0 };

describe("TimerLayout", () => {
  it("offers the categories with a start next to the clock before anything is picked", () => {
    const timer = makeTimer();
    const choseSkillHandler = vi.fn();
    render(
      <TimerLayout
        timer={timer}
        timerData={zero as never}
        chosenSkill={null}
        timerSubmitHandler={vi.fn()}
        choseSkillHandler={choseSkillHandler}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText("Choose what you are practising")).toBeDefined();
    fireEvent.click(screen.getAllByRole("button", { name: /technique/i })[0]);
    expect(choseSkillHandler).toHaveBeenCalledWith("technique");
    expect(timer.startTimer).toHaveBeenCalled();
  });

  it("at 00:00 goes back to Practice instead of opening an empty report", () => {
    const onBack = vi.fn();
    const timerSubmitHandler = vi.fn();
    render(
      <TimerLayout
        timer={makeTimer()}
        timerData={zero as never}
        chosenSkill={null}
        timerSubmitHandler={timerSubmitHandler}
        choseSkillHandler={vi.fn()}
        onBack={onBack}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /back to practice/i }));
    expect(onBack).toHaveBeenCalled();
    expect(timerSubmitHandler).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /log the time manually/i })).toBeDefined();
  });
});
