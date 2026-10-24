import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

import { NOTE_SPACING_MAX, NOTE_SPACING_MIN } from "./tablatureSettings";
import { TAB_BASE_HEIGHT } from "./useTablatureWorkerBridge";

/**
 * How far ahead of the cursor the player should be able to read, in seconds.
 * At the stored default (100%) a 1200px board at 120 BPM shows barely ~2s, which
 * is what "the tab runs away from me" was about.
 */
export const LOOKAHEAD_SECONDS = 3.5;

/** Durations of this share of the notes may squeeze below a comfortable width. */
const DENSITY_PERCENTILE = 0.15;

// Mirrors of the worker's layout — keep in sync with TablatureViewer.worker.ts.
const GUTTER_W = 36;
const BLOCK_PAD = 4;
const BLOCK_GAP = 4;
/** Extra room between two neighbouring pills so a run doesn't read as one bar. */
const PILL_BREATHING = 4;
/** The worker plays with the cursor this far into the board. */
const CURSOR_FRACTION = 1 / 4;

/** The worker's beat width at zoom 1, in world px. */
export function baseBeatWidth(viewerWidth: number): number {
  return Math.max(120, Math.min(200, viewerWidth / 4));
}

/** Clamps to the slider's range and rounds to a 5% step, like a value a person would pick. */
function clampSpacing(spacing: number): number {
  const clamped = Math.min(
    NOTE_SPACING_MAX,
    Math.max(NOTE_SPACING_MIN, spacing),
  );
  return Math.round(clamped * 20) / 20;
}

export interface AutoTabZoomInput {
  measures: TablatureMeasure[];
  /** Tempo the exercise opens at (quarter notes per minute). */
  bpm: number;
  /** Viewer size in CSS px. */
  width: number;
  height: number;
  /** Fret-pill height in world px (the pill preset's height). */
  pillHeight: number;
  /** The "Fret number size" setting. */
  fretFontScale: number;
  /** Whether the tuning gutter is drawn — it eats into the look-ahead. */
  hasGutter: boolean;
  /**
   * Factor the caller multiplies the stored spacing by before it reaches the
   * viewer (the phone panel's MOBILE_FIT). The result is in stored units.
   */
  zoomScale?: number;
}

/**
 * Picks the note spacing an exercise opens with.
 *
 * Two forces pull on it:
 *  - **speed** — the faster the tempo, the faster each beat's pixels slide past.
 *    The ceiling is the widest spacing that still leaves `LOOKAHEAD_SECONDS` of
 *    music between the cursor and the right edge.
 *  - **density** — compress too far and sixteenths collapse into one smear.
 *    The floor is the narrowest spacing at which all but the shortest
 *    `DENSITY_PERCENTILE` of notes still get a pill wide enough for its label.
 *
 * Readability wins when the two disagree: a fast, dense run scrolls quickly,
 * but it stays legible. A sparse, slow exercise is never blown up past 100%.
 */
export function computeAutoTabZoom({
  measures,
  bpm,
  width,
  height,
  pillHeight,
  fretFontScale,
  hasGutter,
  zoomScale = 1,
}: AutoTabZoomInput): number {
  const fallback = clampSpacing(1);
  if (width <= 0 || height <= 0 || bpm <= 0) return fallback;

  const durations: number[] = [];
  let hasTwoDigitFret = false;
  let ratio = 1;
  let peakRatio = 0;
  for (const measure of measures) {
    if (measure.tempoChange !== undefined) ratio = measure.tempoChange;
    let measureHasNotes = false;
    for (const beat of measure.beats) {
      if (beat.notes.length === 0 || beat.duration <= 0) continue;
      measureHasNotes = true;
      durations.push(beat.duration);
      if (beat.notes.some((n) => n.fret >= 10)) hasTwoDigitFret = true;
    }
    if (measureHasNotes) peakRatio = Math.max(peakRatio, ratio);
  }
  if (durations.length === 0) return fallback;

  const baseBW = baseBeatWidth(width);
  // World units: the worker scales the whole drawing by height / TAB_BASE_HEIGHT.
  const viewW = width / (height / TAB_BASE_HEIGHT);
  const lookaheadW = viewW * (1 - CURSOR_FRACTION) - (hasGutter ? GUTTER_W : 0);
  const peakBpm = bpm * (peakRatio || 1);

  // Widest beat that still shows LOOKAHEAD_SECONDS ahead of the cursor.
  const speedBW = (lookaheadW * 60) / (peakBpm * LOOKAHEAD_SECONDS);

  // Narrowest beat at which a typical short note still fits its pill.
  durations.sort((a, b) => a - b);
  const shortDuration =
    durations[Math.floor((durations.length - 1) * DENSITY_PERCENTILE)];
  // Same estimate the worker sizes a pill's head with.
  const labelW = Math.ceil(
    (hasTwoDigitFret ? 2 : 1) * 13 * fretFontScale * 0.62 + 10,
  );
  const pillW = Math.max(pillHeight, labelW);
  const densityBW =
    (pillW + BLOCK_PAD + BLOCK_GAP + PILL_BREATHING) / shortDuration;

  const beatWidth = Math.max(densityBW, Math.min(speedBW, baseBW));
  return clampSpacing(beatWidth / baseBW / zoomScale);
}
