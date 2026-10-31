// Side effects, in this order: the worker's `self` first, then the worker itself.
import "./boardSelf";
import "feature/exercisePlan/views/PracticeSession/components/TablatureViewer.worker";

import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { scrollAfterDrag } from "feature/exercisePlan/views/PracticeSession/components/tablatureDirection";
import { buildTablatureRenderData } from "feature/exercisePlan/views/PracticeSession/components/tablatureRenderData";
import {
  baseBeatWidth,
  beatToX,
  buildBeatXMap,
  DEFAULT_PILL_METRICS,
  xToBeat,
} from "feature/exercisePlan/views/PracticeSession/components/tabSpacing";
import type {
  TablatureStylePatch,
  TuningGutterString,
} from "feature/exercisePlan/views/PracticeSession/components/useTablatureWorkerBridge";

import { boardSelf } from "./boardSelf";

/**
 * The practice session's tab board, for the MCP tab preview.
 *
 * The very renderer the session uses (TablatureViewer.worker), run on the
 * page's thread and driven the way `useTablatureWorkerBridge` drives it, minus
 * everything that listens to the player: a paused board scrolls by dragging
 * and a click picks the bar to start from; while the music plays, the cursor
 * follows the position the page reports.
 *
 * Bundled by scripts/buildMcpTabBoard.mjs into tabBoardBundle.generated.ts.
 */

/** World height the worker draws at. Keep in sync with TAB_BASE_HEIGHT in useTablatureWorkerBridge. */
const BASE_H = 300;
/** Width of the tuning gutter. Keep in sync with TAB_GUTTER_W in useTablatureWorkerBridge. */
const GUTTER_W = 36;
/** A pointer that moved less than this, this quickly, clicked rather than dragged. */
const CLICK_PX = 5;
const CLICK_MS = 400;

export interface TabBoardInput {
  measures: TablatureMeasure[];
  bpm: number;
  palette: readonly string[];
  style: TablatureStylePatch;
  tuningStrings: TuningGutterString[];
}

export interface TabBoard {
  /** Start the cursor from `positionMs` into the music, or move it there while playing. */
  play: (positionMs: number) => void;
  /** Stop the cursor at the beat it reached. */
  pause: (beat: number) => void;
  /** Park the paused cursor at `beat` (quarter notes from the start). */
  seek: (beat: number) => void;
  /** Whether anyone can see the board — a hidden one stops painting. */
  setVisible: (visible: boolean) => void;
}

const post = (data: Record<string, unknown>) =>
  boardSelf.onmessage?.({ data } as MessageEvent);

/** The bar `beat` falls in, by where it starts. */
function measureStart(measureEndXs: number[], beat: number): number {
  let start = 0;
  for (const end of measureEndXs) {
    if (beat < end) break;
    start = end;
  }
  return start;
}

export function mountTabBoard(
  container: HTMLElement,
  input: TabBoardInput,
  /** A click on a paused board: the bar the player picked, in beats. */
  onSeek: (beat: number) => void,
): TabBoard {
  const { style } = input;
  const renderData = buildTablatureRenderData(
    input.measures,
    input.palette,
    style.stringSpacing,
    style.flipStrings,
    style.stringCount,
  );
  const gutterW = input.tuningStrings.length > 0 ? GUTTER_W : 0;

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y";
  container.appendChild(canvas);

  let width = Math.max(1, container.clientWidth);
  let height = Math.max(1, container.clientHeight);
  const vscale = () => height / BASE_H;
  const xMap = () =>
    buildBeatXMap(renderData.renderBeats, renderData.totalBeats, baseBeatWidth(width), {
      pillHeight: style.pillHeight ?? DEFAULT_PILL_METRICS.pillHeight,
      fretFontScale: style.fretFontScale ?? DEFAULT_PILL_METRICS.fretFontScale,
    });

  // The worker is handed an HTML canvas instead of an OffscreenCanvas; it only
  // sizes it and draws into its 2D context, which both kinds share.
  const dpr = window.devicePixelRatio || 1;
  post({ type: "INIT", canvas, dpr, width, height });
  post({ type: "STYLE", ...style });
  post({ type: "TUNING", strings: input.tuningStrings });
  post({
    type: "DATA",
    renderBeats: renderData.renderBeats,
    measureEndXs: renderData.measureEndXs,
    totalBeats: renderData.totalBeats,
    timeSigMarkers: renderData.timeSigMarkers,
    tupletGroups: renderData.tupletGroups,
    tempoMap: renderData.tempoMap,
    hasAccentedNotes: renderData.hasAccentedNotes,
    hasDynamics: renderData.hasDynamics,
  });
  post({ type: "RESET" });

  let playing = false;
  // Where the paused view sits — the base a drag scrolls from.
  let paused = { scrollX: 0, cursorPos: 0 };

  const park = (beat: number) => {
    const cursorPos = beatToX(xMap(), beat);
    const scrollX = Math.max(0, cursorPos - width / vscale() / 4);
    paused = { scrollX, cursorPos };
    post({ type: "SCROLL", scrollX, cursorPos });
  };

  new ResizeObserver(() => {
    const nextWidth = Math.max(1, container.clientWidth);
    const nextHeight = Math.max(1, container.clientHeight);
    if (nextWidth === width && nextHeight === height) return;
    const beat = xToBeat(xMap(), paused.cursorPos);
    width = nextWidth;
    height = nextHeight;
    post({ type: "RESIZE", width, height, dpr: window.devicePixelRatio || 1 });
    if (!playing) park(beat);
  }).observe(container);

  let drag: { startX: number; at: number; scrollX: number } | null = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (playing) return;
    drag = { startX: event.clientX, at: Date.now(), scrollX: paused.scrollX };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const scrollX = scrollAfterDrag(drag.scrollX, (event.clientX - drag.startX) / vscale(), false);
    paused = { ...paused, scrollX };
    post({ type: "SCROLL", scrollX, cursorPos: paused.cursorPos });
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!drag) return;
    const clicked =
      Math.abs(event.clientX - drag.startX) < CLICK_PX && Date.now() - drag.at < CLICK_MS;
    drag = null;
    if (!clicked) return;
    const rect = canvas.getBoundingClientRect();
    const worldX = (event.clientX - rect.left) / vscale() - gutterW + paused.scrollX;
    const beat = measureStart(renderData.measureEndXs, Math.max(0, xToBeat(xMap(), worldX)));
    park(beat);
    onSeek(beat);
  });
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });

  let startWallMs = 0;
  return {
    play: (positionMs) => {
      const nextStart = Date.now() - positionMs;
      // The page reports the position many times a second; re-anchoring on
      // each report would jitter the cursor, so only a real drift moves it.
      if (playing && Math.abs(nextStart - startWallMs) < 60) return;
      playing = true;
      startWallMs = nextStart;
      post({
        type: "PLAYBACK",
        isPlaying: true,
        bpm: input.bpm,
        countInRemaining: 0,
        startWallMs,
        audioStartSec: null,
      });
    },
    pause: (beat) => {
      playing = false;
      post({ type: "PLAYBACK", isPlaying: false, bpm: input.bpm, countInRemaining: 0, startWallMs: null, audioStartSec: null });
      park(beat);
    },
    seek: (beat) => {
      if (!playing) park(beat);
    },
    setVisible: (visible) => post({ type: "VISIBLE", visible }),
  };
}

(globalThis as { RiffTabBoard?: { mount: typeof mountTabBoard } }).RiffTabBoard = {
  mount: mountTabBoard,
};
