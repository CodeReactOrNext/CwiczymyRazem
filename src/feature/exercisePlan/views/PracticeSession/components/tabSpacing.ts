/**
 * Where each beat sits across the tab board.
 *
 * Time maps to x linearly — one beat is `beatWidth` world px — except that a
 * beat with notes never gets less room than its fret pill needs. Pills keep
 * their size at every zoom, so without that floor a fast run (sixteenths,
 * sextuplets) on a zoomed-out board piles its pills on top of each other. With
 * it the run spreads out and the board scrolls faster while the run passes.
 *
 * Shared by the worker, which draws with it, and the main thread, which turns
 * clicks, hovers and seeks into positions with it — the two must agree on every
 * beat's x, so both build the map from the same inputs.
 */

// Mirrors of the worker's pill geometry — keep in sync with TablatureViewer.worker.ts.
const BLOCK_PAD = 4;
const BLOCK_GAP = 4;
const FRET_FONT_PX = 13;

/** The pill size settings the worker draws with (its STYLE message). */
export interface PillMetrics {
  pillHeight: number;
  fretFontScale: number;
}

/** The worker's pill size before any STYLE message arrives. */
export const DEFAULT_PILL_METRICS: PillMetrics = { pillHeight: 22, fretFontScale: 1 };

/** What the map needs from a render beat. */
export interface SpacedBeat {
  offsetX: number;
  duration: number;
  notes: readonly { fret: number; isGhost?: boolean }[];
}

/** The beat width at zoom 1 for a board this wide, in world px. */
export function baseBeatWidth(viewerWidth: number): number {
  return Math.max(120, Math.min(200, viewerWidth / 4));
}

/** Width of a fret pill's head carrying `chars` characters — the estimate the worker draws with. */
export function pillHeadWidth(chars: number, { pillHeight, fretFontScale }: PillMetrics): number {
  return Math.max(pillHeight, Math.ceil(chars * Math.round(FRET_FONT_PX * fretFontScale) * 0.62 + 10));
}

/** The least room a beat needs: its widest pill plus the gaps around it. 0 for a rest. */
export function minBeatWidth(beat: SpacedBeat, metrics: PillMetrics): number {
  if (beat.notes.length === 0 || beat.duration <= 0) return 0;
  let chars = 1;
  for (const note of beat.notes) {
    chars = Math.max(chars, String(note.fret).length + (note.isGhost ? 2 : 0));
  }
  return BLOCK_PAD + pillHeadWidth(chars, metrics) + BLOCK_GAP;
}

export interface BeatXMap {
  /** World px per beat where nothing is stretched, and before or after the song. */
  beatWidth: number;
  /**
   * Breakpoints in beats: entry `i` is where render beat `i` starts, the one
   * after the last beat is where it ends. x is linear between two of them.
   */
  beats: Float64Array;
  /** World x of each breakpoint — `xs[i]`..`xs[i + 1]` is render beat `i`. */
  xs: Float64Array;
  /** World x of the song's end: the width of one repetition. */
  totalX: number;
}

export function buildBeatXMap(
  renderBeats: readonly SpacedBeat[],
  totalBeats: number,
  beatWidth: number,
  metrics: PillMetrics,
): BeatXMap {
  const n = renderBeats.length;
  const lastEnd = n > 0 ? renderBeats[n - 1].offsetX + renderBeats[n - 1].duration : 0;
  // A song that runs on past its last beat keeps that stretch linear.
  const tail = totalBeats > lastEnd ? 1 : 0;
  const beats = new Float64Array(n + 1 + tail);
  const xs = new Float64Array(n + 1 + tail);

  let x = n > 0 ? renderBeats[0].offsetX * beatWidth : 0;
  for (let i = 0; i < n; i++) {
    const beat = renderBeats[i];
    beats[i] = beat.offsetX;
    xs[i] = x;
    x += Math.max(beat.duration * beatWidth, minBeatWidth(beat, metrics));
  }
  beats[n] = lastEnd;
  xs[n] = x;
  if (tail) {
    beats[n + 1] = totalBeats;
    xs[n + 1] = x + (totalBeats - lastEnd) * beatWidth;
  }
  return { beatWidth, beats, xs, totalX: xs[xs.length - 1] };
}

/** Index of the last breakpoint at or before `value` in an ascending array. */
function segmentAt(points: Float64Array, value: number): number {
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid] <= value) lo = mid; else hi = mid;
  }
  return lo;
}

/** World x of a position in beats. */
export function beatToX(map: BeatXMap, beat: number): number {
  const { beats, xs, beatWidth } = map;
  const last = beats.length - 1;
  if (last < 1 || beat <= beats[0]) return xs[0] + (beat - beats[0]) * beatWidth;
  if (beat >= beats[last]) return xs[last] + (beat - beats[last]) * beatWidth;
  const i = segmentAt(beats, beat);
  const span = beats[i + 1] - beats[i];
  return span > 0 ? xs[i] + ((beat - beats[i]) / span) * (xs[i + 1] - xs[i]) : xs[i];
}

/** Position in beats of a world x — the inverse of beatToX. */
export function xToBeat(map: BeatXMap, x: number): number {
  const { beats, xs, beatWidth } = map;
  const last = xs.length - 1;
  if (last < 1 || x <= xs[0]) return beats[0] + (x - xs[0]) / beatWidth;
  if (x >= xs[last]) return beats[last] + (x - xs[last]) / beatWidth;
  const i = segmentAt(xs, x);
  const width = xs[i + 1] - xs[i];
  return width > 0 ? beats[i] + ((x - xs[i]) / width) * (beats[i + 1] - beats[i]) : beats[i];
}
