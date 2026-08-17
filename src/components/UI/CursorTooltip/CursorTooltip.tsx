import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Horizontal gap kept between the cursor and the card. */
const CURSOR_GAP = 16;
/** Vertical offset, so the card's leading edge sits just past the cursor. */
const LEAD = 8;
/** How close to the window edge the card is allowed to come. */
const EDGE_GAP = 8;

interface CursorTooltipProps {
  /** Cursor position in viewport (client) coordinates. */
  x: number;
  y: number;
  /** Card width in px. */
  width?: number;
  children: React.ReactNode;
}

/**
 * A card that follows the cursor and flips instead of running off screen: to
 * the left of the cursor when the right edge is close, and upwards when the
 * pointer is near the bottom of the window. The card is measured after it
 * mounts, so its height does not have to be known up front.
 */
export const CursorTooltip = ({ x, y, width = 250, children }: CursorTooltipProps) => {
  const ref = useRef<HTMLDivElement>(null);
  // Null until the card has been measured — it stays hidden for that first
  // pass so it never flashes in the wrong corner.
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = x + CURSOR_GAP + w > vw - EDGE_GAP ? x - CURSOR_GAP - w : x + CURSOR_GAP;
    const top = y - LEAD + h > vh - EDGE_GAP ? y + LEAD - h : y - LEAD;

    // Clamp as well as flip: a card taller than the space on either side of the
    // cursor would still hang off the window otherwise.
    setPos({
      left: Math.max(EDGE_GAP, Math.min(left, vw - EDGE_GAP - w)),
      top: Math.max(EDGE_GAP, Math.min(top, vh - EDGE_GAP - h)),
    });
  }, [x, y, children]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      className="pointer-events-none fixed z-[9999]"
      style={{
        width,
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        visibility: pos ? "visible" : "hidden",
      }}>
      {children}
    </div>,
    document.body
  );
};
