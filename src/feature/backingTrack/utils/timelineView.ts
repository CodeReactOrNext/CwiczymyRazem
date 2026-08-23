/**
 * What part of the recording the alignment timeline is looking at.
 *
 * Kept apart from the components because getting this wrong is invisible in a
 * screenshot and maddening in use: zoom that drifts off the thing you were
 * studying, panning that fights the playhead, a window that can be scrolled into
 * empty space. All of it is arithmetic, so all of it can be tested.
 */

/** Closest you can get: about a beat and a half at 120 BPM, across the screen. */
export const MIN_WINDOW_SEC = 0.5;
/** Furthest out: enough to see a whole song section at once. */
export const MAX_WINDOW_SEC = 120;

/** One detent of the wheel — finer than a button so it feels continuous. */
export const ZOOM_STEP = 1.6;

/** One press of a zoom button. A clean doubling is predictable to work with. */
export const ZOOM_BUTTON_STEP = 2;

export function clampWindow(windowSec: number): number {
  if (!Number.isFinite(windowSec)) return 4;
  return Math.min(MAX_WINDOW_SEC, Math.max(MIN_WINDOW_SEC, windowSec));
}

export interface TimelineWindowState {
  /** Seconds of recording across the full width. */
  windowSec: number;
  /** Second at the middle of the view. */
  centreSec: number;
}

/**
 * Zooms while holding one moment still.
 *
 * Zooming around the centre is what makes a timeline feel like it is running
 * away from you: the transient you were leaning towards slides off screen the
 * moment you lean in. Anchoring on the pointer is the whole difference between
 * "I can work here" and "I keep losing my place".
 */
export function zoomAround(
  state: TimelineWindowState,
  anchorSec: number,
  factor: number,
): TimelineWindowState {
  const windowSec = clampWindow(state.windowSec * factor);
  if (!Number.isFinite(anchorSec)) return { windowSec, centreSec: state.centreSec };

  // The anchor sits the same fraction across the view before and after, so its
  // distance from the centre scales with the window.
  const ratio = windowSec / state.windowSec;
  return {
    windowSec,
    centreSec: anchorSec - (anchorSec - state.centreSec) * ratio,
  };
}

/**
 * Keeps the view over the recording.
 *
 * Half a window of slack either end so the first and last moments can still be
 * brought to the middle to work on, which is exactly where the tab's start
 * marker usually needs dragging.
 */
export function clampCentre(
  centreSec: number,
  windowSec: number,
  durationSec: number,
): number {
  if (!Number.isFinite(centreSec)) return 0;
  if (!Number.isFinite(durationSec) || durationSec <= 0) return Math.max(0, centreSec);
  return Math.min(durationSec + windowSec / 2, Math.max(-windowSec / 2, centreSec));
}

/** Seconds under a pointer, given where the view is and how wide the lane is. */
export function secAtPixel(params: {
  pixelX: number;
  laneWidthPx: number;
  windowSec: number;
  centreSec: number;
}): number {
  const { pixelX, laneWidthPx, windowSec, centreSec } = params;
  if (!(laneWidthPx > 0)) return centreSec;
  return centreSec - windowSec / 2 + (pixelX / laneWidthPx) * windowSec;
}

/**
 * Zoom factor for one wheel event.
 *
 * Trackpads report many small deltas and mice report a few large ones, so the
 * raw number is unusable directly — its *sign* is the instruction and its size
 * is capped to keep one violent flick from crossing the whole zoom range.
 */
export function wheelZoomFactor(deltaY: number): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) return 1;
  const steps = Math.min(3, Math.abs(deltaY) / 100);
  const magnitude = 1 + (ZOOM_STEP - 1) * Math.max(0.25, steps);
  return deltaY > 0 ? magnitude : 1 / magnitude;
}
