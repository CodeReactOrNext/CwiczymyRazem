// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HOLD_FIRST_REPEAT_MS, useHoldRepeat } from "./useHoldRepeat";

const Stepper = ({
  onStep,
  disabled = false,
}: {
  onStep: () => void;
  disabled?: boolean;
}) => {
  const hold = useHoldRepeat(onStep, disabled);
  return (
    <button disabled={disabled} {...hold}>
      +
    </button>
  );
};

const press = (el: HTMLElement) => fireEvent.pointerDown(el, { button: 0 });
const release = () => fireEvent.pointerUp(window);

describe("useHoldRepeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("steps exactly once for a plain click", () => {
    const onStep = vi.fn();
    const { getByRole } = render(<Stepper onStep={onStep} />);
    const button = getByRole("button");

    press(button);
    release();
    fireEvent.click(button, { detail: 1 });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it("starts repeating only after the press has lasted a beat", () => {
    const onStep = vi.fn();
    const { getByRole } = render(<Stepper onStep={onStep} />);

    press(getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(HOLD_FIRST_REPEAT_MS - 1);
    });
    expect(onStep).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onStep).toHaveBeenCalledTimes(2);
  });

  it("speeds up the longer it is held, and stops on release", () => {
    const onStep = vi.fn();
    const { getByRole } = render(<Stepper onStep={onStep} />);

    press(getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    // A flat 400 ms repeat would manage 8 steps in three seconds.
    const held = onStep.mock.calls.length;
    expect(held).toBeGreaterThan(30);

    release();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onStep).toHaveBeenCalledTimes(held);
  });

  it("stops when the pointer slides off the button", () => {
    const onStep = vi.fn();
    const { getByRole } = render(<Stepper onStep={onStep} />);
    const button = getByRole("button");

    press(button);
    fireEvent.pointerLeave(button);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it("stops once the button goes disabled at its bound", () => {
    const onStep = vi.fn();
    const { getByRole, rerender } = render(<Stepper onStep={onStep} />);

    press(getByRole("button"));
    rerender(<Stepper onStep={onStep} disabled />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it("steps once for keyboard activation", () => {
    const onStep = vi.fn();
    const { getByRole } = render(<Stepper onStep={onStep} />);

    fireEvent.click(getByRole("button"), { detail: 0 });

    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it("ignores everything but the main button", () => {
    const onStep = vi.fn();
    const { getByRole } = render(<Stepper onStep={onStep} />);

    fireEvent.pointerDown(getByRole("button"), { button: 2 });

    expect(onStep).not.toHaveBeenCalled();
  });
});
