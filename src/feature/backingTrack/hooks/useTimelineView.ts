import { useCallback, useEffect, useRef, useState } from "react";

import {
  clampCentre,
  clampWindow,
  secAtPixel,
  wheelZoomFactor,
  ZOOM_BUTTON_STEP,
  zoomAround,
} from "../utils/timelineView";

/** Opens on a couple of bars at a typical tempo — close enough to see attacks. */
const DEFAULT_WINDOW_SEC = 4;

export interface TimelineView {
  windowSec: number;
  /** Null means the view is following the playhead; the lanes read it that way. */
  centreSecOverride: number | null;
  isFollowing: boolean;
  setFollowing: (following: boolean) => void;
  /** Steps the zoom about the middle — what the toolbar buttons do. */
  zoomBy: (factor: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Parks the view on a moment, detaching it from the playhead. */
  centreOn: (sec: number) => void;
  /**
   * Slides the parked view, parking it first if it was following.
   *
   * Dragging the recording needs this: the view centre is the playhead, and the
   * playhead sits at the offset, so moving the offset moved the viewport by the
   * same amount and the waveform stayed nailed to the screen. Shifting the
   * centre with it is what lets the audio follow the hand.
   */
  shiftCentre: (deltaSec: number) => void;
  /** Stops the view chasing the playhead, holding it exactly where it is. */
  parkView: () => void;
  /** Sets how much is on screen outright — what the zoom presets do. */
  zoomTo: (windowSec: number) => void;
  /** Brings the playhead back into view without resuming the chase. */
  jumpToPlayhead: () => void;
  /** Put on the element wrapping the whole timeline — it owns the wheel. */
  attachContainer: (element: HTMLDivElement | null) => void;
  /** Put on the element that spans exactly the lanes' width. */
  attachLaneViewport: (element: HTMLDivElement | null) => void;
  /** Starts a pan from a pointer position. */
  beginPan: (clientX: number) => void;
  panTo: (clientX: number) => void;
  endPan: () => void;
  isPanning: boolean;
}

/**
 * Where the alignment timeline is looking, and every way of moving it.
 *
 * Before this the only way to see a different part of the recording was to click
 * the overview map, because dragging a lane was already taken by moving the
 * audio. Wheel, middle-drag and an explicit follow toggle live here so the whole
 * screen shares one answer, and so no lane has to reimplement the arithmetic.
 */
export function useTimelineView(params: {
  /** The recording second the playhead is on right now. */
  getPlayheadSec: () => number;
  durationSec: number;
}): TimelineView {
  const { getPlayheadSec, durationSec } = params;

  const [windowSec, setWindowSec] = useState(DEFAULT_WINDOW_SEC);
  const [centreSecOverride, setCentreSecOverride] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const laneElRef = useRef<HTMLDivElement | null>(null);
  const detachWheelRef = useRef<(() => void) | null>(null);
  const panRef = useRef<{ lastX: number } | null>(null);

  // Mirrors of everything the gesture handlers read. They run long after render,
  // so an effect is early enough and keeps the render pass free of writes.
  const getPlayheadRef = useRef(getPlayheadSec);
  const durationRef = useRef(durationSec);
  const windowRef = useRef(windowSec);
  const overrideRef = useRef(centreSecOverride);
  useEffect(() => {
    getPlayheadRef.current = getPlayheadSec;
    durationRef.current = durationSec;
    windowRef.current = windowSec;
    overrideRef.current = centreSecOverride;
  }, [getPlayheadSec, durationSec, windowSec, centreSecOverride]);

  /** Where the middle of the view actually is, following or not. */
  const resolveCentre = useCallback(() => overrideRef.current ?? getPlayheadRef.current(), []);

  const applyView = useCallback((next: { windowSec: number; centreSec: number }) => {
    const nextWindow = clampWindow(next.windowSec);
    windowRef.current = nextWindow;
    setWindowSec(nextWindow);
    const nextCentre = clampCentre(next.centreSec, nextWindow, durationRef.current);
    overrideRef.current = nextCentre;
    setCentreSecOverride(nextCentre);
  }, []);

  /** Moves the parked centre, seeding it from the playhead if it was following. */
  const shiftCentre = useCallback((deltaSec: number) => {
    const next = clampCentre(
      (overrideRef.current ?? getPlayheadRef.current()) + deltaSec,
      windowRef.current,
      durationRef.current,
    );
    overrideRef.current = next;
    setCentreSecOverride(next);
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      // Detaching on zoom would yank the view off a moving playhead, so a
      // following view stays following and simply changes how much it shows.
      if (overrideRef.current === null) {
        const next = clampWindow(windowRef.current * factor);
        windowRef.current = next;
        setWindowSec(next);
        return;
      }
      const centre = resolveCentre();
      applyView(zoomAround({ windowSec: windowRef.current, centreSec: centre }, centre, factor));
    },
    [applyView, resolveCentre],
  );

  const zoomIn = useCallback(() => zoomBy(1 / ZOOM_BUTTON_STEP), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(ZOOM_BUTTON_STEP), [zoomBy]);

  const centreOn = useCallback((sec: number) => {
    const next = clampCentre(sec, windowRef.current, durationRef.current);
    overrideRef.current = next;
    setCentreSecOverride(next);
  }, []);

  /** Freeze where the view is looking, so a drag has a still background. */
  const parkView = useCallback(() => {
    if (overrideRef.current !== null) return;
    const next = clampCentre(getPlayheadRef.current(), windowRef.current, durationRef.current);
    overrideRef.current = next;
    setCentreSecOverride(next);
  }, []);

  const zoomTo = useCallback((next: number) => {
    // Keep whatever is in the middle in the middle; a preset changes how much
    // you see, not where you are.
    const centre = overrideRef.current;
    const nextWindow = clampWindow(next);
    windowRef.current = nextWindow;
    setWindowSec(nextWindow);
    if (centre !== null) {
      const clamped = clampCentre(centre, nextWindow, durationRef.current);
      overrideRef.current = clamped;
      setCentreSecOverride(clamped);
    }
  }, []);

  /** Unlike Follow, this is a one-off: the view stays put afterwards. */
  const jumpToPlayhead = useCallback(() => {
    const here = getPlayheadRef.current();
    const next = clampCentre(here, windowRef.current, durationRef.current);
    overrideRef.current = next;
    setCentreSecOverride(next);
  }, []);

  const setFollowing = useCallback((following: boolean) => {
    const next = following ? null : getPlayheadRef.current();
    overrideRef.current = next;
    setCentreSecOverride(next);
  }, []);

  const beginPan = useCallback((clientX: number) => {
    panRef.current = { lastX: clientX };
    setIsPanning(true);
    // Grabbing the timeline means wanting to stay where you put it.
    if (overrideRef.current === null) {
      const here = getPlayheadRef.current();
      overrideRef.current = here;
      setCentreSecOverride(here);
    }
  }, []);

  const panTo = useCallback(
    (clientX: number) => {
      const pan = panRef.current;
      const lane = laneElRef.current;
      if (!pan || !lane) return;
      const width = lane.clientWidth || 1;
      // Dragging right shows earlier audio, the way a hand tool moves paper.
      const deltaSec = -(clientX - pan.lastX) * (windowRef.current / width);
      pan.lastX = clientX;
      shiftCentre(deltaSec);
    },
    [shiftCentre],
  );

  const endPan = useCallback(() => {
    panRef.current = null;
    setIsPanning(false);
  }, []);

  const attachLaneViewport = useCallback((element: HTMLDivElement | null) => {
    laneElRef.current = element;
  }, []);

  /**
   * Owns the wheel.
   *
   * A callback ref rather than an effect because the listener has to be
   * non-passive — React's synthetic wheel handler cannot preventDefault, and
   * without that a scroll over the timeline scrolls the practice page away.
   */
  const attachContainer = useCallback(
    (element: HTMLDivElement | null) => {
      detachWheelRef.current?.();
      detachWheelRef.current = null;
      if (!element) return;

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();

        const lane = laneElRef.current;
        const width = lane?.clientWidth ?? 0;

        // Shift, or a trackpad's sideways swipe, scrolls instead of zooming.
        const isScroll = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);
        if (isScroll) {
          const amount = event.shiftKey ? event.deltaY : event.deltaX;
          shiftCentre(amount * (windowRef.current / (width || 1)));
          return;
        }

        const centre = resolveCentre();
        const anchorSec = lane
          ? secAtPixel({
              pixelX: Math.min(
                width,
                Math.max(0, event.clientX - lane.getBoundingClientRect().left),
              ),
              laneWidthPx: width,
              windowSec: windowRef.current,
              centreSec: centre,
            })
          : centre;

        applyView(
          zoomAround(
            { windowSec: windowRef.current, centreSec: centre },
            anchorSec,
            wheelZoomFactor(event.deltaY),
          ),
        );
      };

      element.addEventListener("wheel", onWheel, { passive: false });
      detachWheelRef.current = () => element.removeEventListener("wheel", onWheel);
    },
    [applyView, resolveCentre, shiftCentre],
  );

  useEffect(() => () => detachWheelRef.current?.(), []);

  return {
    windowSec,
    centreSecOverride,
    isFollowing: centreSecOverride === null,
    setFollowing,
    zoomBy,
    zoomIn,
    zoomOut,
    centreOn,
    shiftCentre,
    parkView,
    zoomTo,
    jumpToPlayhead,
    attachContainer,
    attachLaneViewport,
    beginPan,
    panTo,
    endPan,
    isPanning,
  };
}
