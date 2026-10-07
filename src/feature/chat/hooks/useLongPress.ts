import { useCallback, useEffect, useRef } from "react";

/** How long a finger has to rest on a message before its menu opens. */
export const LONG_PRESS_MS = 450;

/** A finger that drifts this far is scrolling, not pressing. */
const MOVE_TOLERANCE_PX = 10;

/**
 * Press-and-hold for touch and pen, the way iMessage opens a message's menu.
 * A mouse is left alone — on a desktop the actions are already a hover away,
 * and a held click is how text gets selected.
 *
 * Spread the returned handlers on the element. The click that ends a long
 * press is swallowed, so letting go doesn't also activate whatever is under
 * the finger.
 */
export const useLongPress = (onLongPress: () => void) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") return;
    fired.current = false;
    start.current = { x: event.clientX, y: event.clientY };
    timer.current = setTimeout(() => {
      fired.current = true;
      clear();
      navigator.vibrate?.(10);
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) clear();
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    // Android raises its own menu on a held finger; ours replaces it.
    onContextMenu: (event: React.MouseEvent) => {
      if (start.current || fired.current) event.preventDefault();
    },
    onClickCapture: (event: React.MouseEvent) => {
      if (!fired.current) return;
      fired.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
};
