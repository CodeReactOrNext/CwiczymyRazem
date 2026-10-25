import { createContext, useContext } from "react";

/**
 * Set by the phone's practice screen while it lays itself on its side (a CSS quarter turn,
 * clockwise) on an upright phone. The browser still hands pointers over in page space, so
 * anything that reads a drag or a tap position off its own box has to know: its x axis then
 * runs down the screen.
 */
export const QuarterTurnContext = createContext(false);

export const useQuarterTurn = () => useContext(QuarterTurnContext);

/**
 * How far along an element's own x axis a pointer landed, 0 at its start edge to 1 at its end.
 * Turned clockwise, that axis runs from the box's top to its bottom.
 */
export function fractionAlongX(
  rect: { left: number; top: number; width: number; height: number },
  pointer: { clientX: number; clientY: number },
  quarterTurned: boolean,
): number {
  const fraction = quarterTurned
    ? (pointer.clientY - rect.top) / rect.height
    : (pointer.clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(1, fraction));
}
