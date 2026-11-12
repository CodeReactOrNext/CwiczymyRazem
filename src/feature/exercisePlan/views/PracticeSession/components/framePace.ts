// Tells a board that keeps up with the screen from one that doesn't, from the
// frame timestamps alone. The tab worker feeds it every animation frame while
// the tab plays; a phone that can't hold the pace is then handed the lite board
// (see `useTabLiteMode` in tablatureSettings.ts).

/** Frames are judged a window at a time. */
const WINDOW_MS = 2000;
/** A window slower than this many frames a second counts against the device. */
const SLOW_FPS = 42;
/** This many slow windows in a row, and the device is slow — not a passing hiccup. */
const SLOW_WINDOWS = 2;
/** A gap this long isn't a slow frame: the tab was in the background, or paused. */
const GAP_MS = 250;
/** The first windows after a start are warm-up — audio opening, the first paints. */
const WARMUP_WINDOWS = 1;

export interface FramePace {
  last: number | null;
  spanMs: number;
  frames: number;
  windows: number;
  slowRun: number;
  reported: boolean;
}

export function createFramePace(): FramePace {
  return { last: null, spanMs: 0, frames: 0, windows: 0, slowRun: 0, reported: false };
}

/** Starts over — playback stopped, or the board's quality changed. A device
 *  already reported stays reported. */
export function resetFramePace(pace: FramePace): void {
  pace.last = null;
  pace.spanMs = 0;
  pace.frames = 0;
  pace.windows = 0;
  pace.slowRun = 0;
}

/**
 * Takes the timestamp of a frame that was painted. True once — the first time
 * the frames have run slow for long enough to call the device slow.
 */
export function observeFrame(pace: FramePace, stampMs: number): boolean {
  const last = pace.last;
  pace.last = stampMs;
  if (last === null) return false;
  const dt = stampMs - last;
  if (!(dt > 0) || dt > GAP_MS) {
    // Not a frame interval at all: the window it fell in says nothing.
    pace.spanMs = 0;
    pace.frames = 0;
    return false;
  }
  pace.spanMs += dt;
  pace.frames++;
  if (pace.spanMs < WINDOW_MS) return false;

  const fps = (pace.frames * 1000) / pace.spanMs;
  pace.spanMs = 0;
  pace.frames = 0;
  pace.windows++;
  if (pace.windows <= WARMUP_WINDOWS) return false;
  pace.slowRun = fps < SLOW_FPS ? pace.slowRun + 1 : 0;
  if (pace.slowRun < SLOW_WINDOWS || pace.reported) return false;
  pace.reported = true;
  return true;
}
