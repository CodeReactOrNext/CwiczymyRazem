import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { useTimelineFrame } from "../hooks/useTimelineFrame";
import type { RecordingTempoMap } from "../utils/tempoMap";

/** Half the popover's width, so it can be centred on its bar line. */
const HALF_WIDTH_PX = 130;

interface TempoAnchorPopoverProps {
  /** Bar the controls belong to, or null to render nothing. */
  beat: number | null;
  tempoMap: RecordingTempoMap;
  windowSec: number;
  centreSecOverride: number | null;
  getPlayheadSec: () => number;
  children: ReactNode;
}

/**
 * Puts the tempo controls next to the bar line they change.
 *
 * They lived in the toolbar, which meant clicking a line in the middle of the
 * screen and then reading a number in the top-left corner — the eye crossing the
 * whole editor on every correction, with nothing tying the two together.
 *
 * Positioned from an animation frame rather than React state: the view can be
 * following a moving playhead, and re-rendering the controls sixty times a
 * second to keep them over a line would make the input unusable to type in.
 *
 * The lane's width is measured when it changes rather than every frame. Reading
 * `clientWidth` and then writing `style.transform` in the same callback is the
 * textbook forced reflow — and this one ran whether or not the popover was even
 * on screen.
 */
export function TempoAnchorPopover({
  beat,
  tempoMap,
  windowSec,
  centreSecOverride,
  getPlayheadSec,
  children,
}: TempoAnchorPopoverProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const laneWidthRef = useRef(0);
  /** Last values written, so an unmoved popover touches no styles at all. */
  const writtenRef = useRef({ transform: "", opacity: "" });

  const paramsRef = useRef({ beat, tempoMap, windowSec, centreSecOverride, getPlayheadSec });
  useEffect(() => {
    paramsRef.current = { beat, tempoMap, windowSec, centreSecOverride, getPlayheadSec };
  });

  const isOpen = beat !== null;
  useEffect(() => {
    const lane = hostRef.current?.parentElement;
    if (!lane) return undefined;

    const measure = () => {
      laneWidthRef.current = lane.clientWidth;
    };
    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(lane);
    return () => observer.disconnect();
  }, [isOpen]);

  useTimelineFrame(() => {
    const host = hostRef.current;
    if (!host) return;

    const p = paramsRef.current;
    if (p.beat === null) return;

    const width = laneWidthRef.current;
    if (width === 0) return;

    const centre = p.centreSecOverride ?? p.getPlayheadSec();
    const windowStart = centre - p.windowSec / 2;
    const x = ((p.tempoMap.secForBeat(p.beat) - windowStart) / p.windowSec) * width;

    // Kept fully on screen: a control that hangs off the edge cannot be used.
    const left = Math.min(width - HALF_WIDTH_PX, Math.max(HALF_WIDTH_PX, x));
    const transform = `translateX(${Math.round(left - HALF_WIDTH_PX)}px)`;
    // Faded out rather than hidden when its bar scrolls away, so the controls
    // never vanish mid-edit while the text cursor is still in the box.
    const opacity = x < -HALF_WIDTH_PX || x > width + HALF_WIDTH_PX ? "0.4" : "1";

    const written = writtenRef.current;
    if (transform !== written.transform) {
      host.style.transform = transform;
      written.transform = transform;
    }
    if (opacity !== written.opacity) {
      host.style.opacity = opacity;
      written.opacity = opacity;
    }
  });

  if (beat === null) return null;

  return (
    <div
      ref={hostRef}
      style={{ width: HALF_WIDTH_PX * 2 }}
      className='absolute -top-1 left-0 z-20 -translate-y-full'>
      <div className='flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2 py-1.5'>{children}</div>
    </div>
  );
}
