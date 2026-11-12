import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Maximize2, Settings2, ZoomIn, ZoomOut } from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";
import { useNoteMarks, useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { useTabOverlay } from "../contexts/TabOverlayContext";
import { useTabPlayUntilStore } from "../hooks/tabPlayUntilStore";
import {
  LITE_MAX_DPR,
  liteTablatureStyle,
  NOTE_SPACING_MAX,
  NOTE_SPACING_MIN,
  PHONE_MAX_DPR,
  useTablatureSettings,
  useTablatureStyle,
  useTabLiteMode,
} from "./tablatureSettings";
import { TablatureSettingsDialog } from "./TablatureSettingsDialog";
import { tuningGutterStrings } from "./tablatureStringRows";
import { TablatureViewer } from "./TablatureViewer";
import { useAutoTabZoom } from "./useAutoTabZoom";
import {
  TablatureResizeHandle,
  useTablatureHeight,
} from "./useTablatureHeight";
import type { TuningGutterString } from "./useTablatureWorkerBridge";

/**
 * Phones hit the 120px/beat floor of the beat-width formula, which shows barely
 * ~1 measure at the stored spacing. Everything the user picks is scaled by this
 * so "100%" on a phone still fits roughly a third more tab than the desktop
 * default would, and zooming from there behaves the same on both.
 */
const MOBILE_FIT = 0.75;
const ZOOM_STEP = 0.05;

/**
 * Own height slot — a 600px desktop viewer would swallow a whole phone screen. Not the old
 * "practice-tab-height-mobile": the board sizes itself to the screen now, and a height dragged
 * in the old fixed layout mustn't switch that off.
 */
const PHONE_HEIGHT_KEY = "practice-tab-height-phone";
const MOBILE_HEIGHT_MIN = 180;
/**
 * Tallest the board gets, dragged or filling the screen. The drawing scales with its height, so
 * past this a taller board shows fewer beats ahead rather than more tab.
 */
const MOBILE_HEIGHT_MAX = 460;
/** The Look / zoom row under the board: h-9 buttons + py-1.5. */
const CONTROLS_BAR_H = 48;

const clampZoom = (z: number) =>
  Math.round(Math.min(NOTE_SPACING_MAX, Math.max(NOTE_SPACING_MIN, z)) * 100) /
  100;

interface MobileTablaturePanelProps {
  /** The fitted note spacing and any later change to it are remembered under this. */
  exerciseId?: string;
  measures: TablatureMeasure[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  countInRemaining?: number;
  frequencyRef?: React.MutableRefObject<number>;
  isListening?: boolean;
  resetKey: number;
  /**
   * The session screen around it is laid on its side (`QUARTER_TURN_STYLE`) — the upright phone.
   * The board then reads the finger along y, and loses its resize handle: dragging it would
   * move the height along the screen's other axis.
   */
  quarterTurned?: boolean;
  /**
   * The session shows nothing but this board ("like a film"): no Look / zoom row, no height cap,
   * square to the screen's edges. The session owns the state — it hides its own chrome too.
   */
  fullscreen?: boolean;
  /** Edge to edge in the screen around it: square corners, no card of its own. */
  flush?: boolean;
  /**
   * Somewhere else to put the Look / zoom / full screen controls — the phone screen's top bar.
   * Given (even while still `null`), the board keeps no row of its own under the tab.
   */
  controlsSlot?: HTMLElement | null;
  /** Given, the board offers a full screen button; also told `false` when the board goes away. */
  onFullscreenChange?: (fullscreen: boolean) => void;
}

/**
 * Tablature card for the phone session view. Same personalisation store as the
 * desktop TablatureSection — board colours, pill shape, palette, lanes — plus
 * touch-sized zoom steps and a drag handle for the viewer height.
 *
 * The board grows into the room its flex-column parent leaves free rather than sitting at a
 * fixed height — at 300px it filled a third of an upright phone and left the rest black. A
 * height the player drags still wins; double-tapping the handle hands it back to the screen.
 */
export const MobileTablaturePanel = memo(function MobileTablaturePanel({
  exerciseId,
  measures,
  bpm,
  isPlaying,
  startTime,
  countInRemaining,
  frequencyRef,
  isListening,
  resetKey,
  quarterTurned = false,
  fullscreen = false,
  flush = false,
  controlsSlot,
  onFullscreenChange,
}: MobileTablaturePanelProps) {
  const { t } = useTranslation("session");
  const { livePitchRef, fillFeedRef } = useNoteMatchingContext();
  const { hitNotes, missedNotes, noteTimings } = useNoteMarks();
  // The exercise's time ends the tab at the last bar it fits (tabPlayUntil.ts).
  const playUntilBeat = useTabPlayUntilStore(s => s.until?.beat ?? null);
  const { overlay: tabOverlay } = useTabOverlay();
  const { tuning, stringCount } = useGuitarTuningContext();
  const {
    settings,
    palette,
    background,
    isLightBoard,
    style,
  } = useTablatureStyle();
  const setSetting = useTablatureSettings((s) => s.set);
  // A phone that can't keep up gets the lite board: by the player's choice, by
  // what the device says about itself, or — the usual way — because the board
  // itself reported its frames falling behind (onSlowFrames).
  const lite = useTabLiteMode(true);
  const boardStyle = useMemo(() => (lite ? liteTablatureStyle(style) : style), [lite, style]);
  const handleSlowFrames = useCallback(() => setSetting("liteDetected", true), [setSetting]);
  const { height, setHeight, isCustom, clearHeight } = useTablatureHeight({
    storageKey: PHONE_HEIGHT_KEY,
    min: MOBILE_HEIGHT_MIN,
    max: MOBILE_HEIGHT_MAX,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // An exercise without a tab has nothing to fill the screen with: the board leaving takes the
  // full screen with it.
  const fullscreenChangeRef = useRef(onFullscreenChange);
  useEffect(() => {
    fullscreenChangeRef.current = onFullscreenChange;
  });
  useEffect(() => () => fullscreenChangeRef.current?.(false), []);

  // Turned, there's no handle to drag a height of one's own with, so the board always fills.
  const fills = quarterTurned || fullscreen || !isCustom;
  // Full screen is the whole point there, even on a screen taller than the usual cap.
  const heightMax = fullscreen ? Infinity : MOBILE_HEIGHT_MAX;
  const controlsElsewhere = controlsSlot !== undefined;
  const controlsBarH = fullscreen || controlsElsewhere ? 0 : CONTROLS_BAR_H;

  const boardRef = useRef<HTMLDivElement>(null);
  const [fitHeight, setFitHeight] = useState<number | null>(null);
  useEffect(() => {
    const board = boardRef.current;
    if (!fills || !board || typeof ResizeObserver === "undefined") return undefined;
    // Observing fires once straight away, which takes the first measurement.
    const observer = new ResizeObserver(([entry]) => {
      setFitHeight(Math.round(entry.contentRect.height));
    });
    observer.observe(board);
    return () => observer.disconnect();
  }, [fills]);

  const viewerHeight =
    fills && fitHeight
      ? Math.min(heightMax, Math.max(MOBILE_HEIGHT_MIN, fitHeight))
      : height;

  const zoom = settings.noteSpacing;
  const handleZoomChange = useCallback(
    (next: number) => setSetting("noteSpacing", clampZoom(next)),
    [setSetting]
  );
  // A phone fits differently from a desktop, so it keeps its own memory slot.
  const fitZoom = useAutoTabZoom({
    storageKey: exerciseId && `${exerciseId}:phone`,
    measures,
    bpm,
    boardRef,
    viewerHeight,
    zoomScale: MOBILE_FIT,
  });

  // Left-gutter tuning legend, same mapping as the desktop section.
  const tuningStrings = useMemo<TuningGutterString[]>(() => {
    if (!settings.showTuningGutter) return [];
    return tuningGutterStrings(tuning.notation, stringCount, palette);
  }, [tuning.notation, stringCount, palette, settings.showTuningGutter]);

  const atMin = zoom <= NOTE_SPACING_MIN + 1e-6;
  const atMax = zoom >= NOTE_SPACING_MAX - 1e-6;
  const zoomBtn =
    "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors active:bg-white/10 disabled:opacity-30";

  const lookButton = (
    <button
      type='button'
      onClick={() => setIsSettingsOpen(true)}
      aria-label={t("tab.settings")}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-lg text-zinc-300 transition-colors active:bg-white/10",
        controlsElsewhere ? "w-9 justify-center" : "px-2.5",
      )}>
      <Settings2 className='h-4 w-4 shrink-0' />
      {/* In the top bar the icon stands alone — the label has no room there. */}
      {!controlsElsewhere && <span className='text-xs font-semibold'>{t("tab.look")}</span>}
    </button>
  );
  const zoomControls = (
    <div className='flex items-center gap-0.5'>
      <button
        type='button'
        onClick={() => handleZoomChange(zoom - ZOOM_STEP)}
        disabled={atMin}
        aria-label={t("tab.zoom_out")}
        className={zoomBtn}>
        <ZoomOut className='h-4 w-4' />
      </button>
      <button
        type='button'
        onClick={() => handleZoomChange(fitZoom)}
        aria-label={t("tab.reset_zoom")}
        className={cn(
          "font-mono rounded-lg py-2 text-center text-xs font-semibold tabular-nums text-zinc-300 transition-colors active:bg-white/10",
          controlsElsewhere ? "min-w-[2.75rem] px-1" : "min-w-[3.25rem] px-1.5",
        )}>
        {Math.round(zoom * 100)}%
      </button>
      <button
        type='button'
        onClick={() => handleZoomChange(zoom + ZOOM_STEP)}
        disabled={atMax}
        aria-label={t("tab.zoom_in")}
        className={zoomBtn}>
        <ZoomIn className='h-4 w-4' />
      </button>
      {onFullscreenChange && (
        <button
          type='button'
          onClick={() => onFullscreenChange(true)}
          aria-label={t("tab.fullscreen")}
          className={cn(zoomBtn, !controlsElsewhere && "ml-2")}>
          <Maximize2 className='h-4 w-4' />
        </button>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden",
        !fullscreen && !flush && "rounded-lg",
        fills && "flex-1",
      )}
      style={{
        backgroundColor: background,
        ...(fills && {
          minHeight: MOBILE_HEIGHT_MIN + controlsBarH,
          ...(!fullscreen && { maxHeight: MOBILE_HEIGHT_MAX + controlsBarH }),
        }),
      }}>
      {/* The viewer sits out of flow, so the board's height is the one the layout gives it —
          a viewer in flow would hold the board at its last height and never let it shrink
          when something (the mic score) needs the room. */}
      <div
        ref={boardRef}
        className={cn("relative", fills && "min-h-0 flex-1")}
        style={fills ? undefined : { height }}>
        {tabOverlay}
        <div className='absolute inset-x-0 top-0'>
          <TablatureViewer
            measures={measures}
            bpm={bpm}
            isPlaying={isPlaying}
            startTime={startTime}
            countInRemaining={countInRemaining}
            className='w-full'
            frequencyRef={frequencyRef}
            isListening={isListening}
            hitNotes={hitNotes}
            missedNotes={missedNotes}
            noteTimings={noteTimings}
            livePitchRef={livePitchRef}
            fillFeedRef={fillFeedRef}
            currentBeatsElapsed={0}
            resetKey={resetKey}
            playUntilBeat={playUntilBeat}
            zoom={zoom * MOBILE_FIT}
            heightPx={viewerHeight}
            tuningStrings={tuningStrings}
            stringCount={stringCount}
            style={boardStyle}
            maxDpr={lite ? LITE_MAX_DPR : PHONE_MAX_DPR}
            onSlowFrames={handleSlowFrames}
            ambientGlow={settings.ambientGlowPhone && !lite}
            palette={palette}
            isLightBoard={isLightBoard}
            quarterTurned={quarterTurned}
          />
        </div>
        {/* Turned, the board's height is the screen's width — nothing to drag. */}
        {!quarterTurned && !fullscreen && (
          <TablatureResizeHandle
            height={viewerHeight}
            onChange={setHeight}
            onReset={clearHeight}
          />
        )}
      </div>

      {/* Controls sit under the board rather than floating over it — on a phone
          there is no spare canvas to cover without hiding notes. */}
      {!fullscreen && !controlsElsewhere && (
        <div className='flex shrink-0 items-center justify-between gap-2 bg-black/40 px-2 py-1.5'>
          {lookButton}
          {zoomControls}
        </div>
      )}
      {!fullscreen && controlsSlot && createPortal(
        <>
          {lookButton}
          {zoomControls}
        </>,
        controlsSlot,
      )}

      <TablatureSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
});
