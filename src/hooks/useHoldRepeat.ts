import type { MouseEvent, PointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

/** How long a press has to last before it starts repeating. */
export const HOLD_FIRST_REPEAT_MS = 400;
/** The repeat never runs faster than this. */
export const HOLD_FASTEST_MS = 40;
/** Each repeat comes this much sooner than the one before. */
const HOLD_RAMP = 0.8;

/**
 * Press-and-hold auto-repeat for a stepper button: one step on press, then —
 * after a beat, so a plain click is still exactly one — steps that come faster
 * the longer the button is held. Forty screws is one held press, not forty.
 *
 * Spread the returned handlers on the button. Keyboard activation stays a
 * single step through `onClick`; a pointer press has already stepped by the
 * time its click lands, so that click is ignored.
 */
export const useHoldRepeat = (onStep: () => void, disabled = false) => {
  const stepRef = useRef(onStep);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    stepRef.current = onStep;
  });

  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  // The press can end anywhere — off the button, or on a button that went
  // disabled at its bound and no longer hears its own pointerup — so the end
  // is listened for on the window.
  useEffect(() => {
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    return () => {
      stop();
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
    };
  }, [stop]);

  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || disabled) return;
    stop();
    stepRef.current();
    const repeat = (delay: number) => {
      timer.current = window.setTimeout(() => {
        stepRef.current();
        repeat(Math.max(HOLD_FASTEST_MS, delay * HOLD_RAMP));
      }, delay);
    };
    repeat(HOLD_FIRST_REPEAT_MS);
  };

  const onClick = (e: MouseEvent<HTMLElement>) => {
    // `detail` counts the clicks of a pointer; Enter and Space send 0.
    if (e.detail === 0 && !disabled) stepRef.current();
  };

  return {
    onPointerDown,
    onPointerLeave: stop,
    onClick,
    onContextMenu: (e: MouseEvent<HTMLElement>) => e.preventDefault(),
  };
};
