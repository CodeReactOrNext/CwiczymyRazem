import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { BackingTrackButton } from "feature/backingTrack/components/BackingTrackButton";
import type { BackingTrackStatus } from "feature/backingTrack/utils/backingTrackStatus";
import { useTranslation } from "hooks/useTranslation";
import { Settings2, Timer, X, ZoomIn, ZoomOut } from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { useSessionUI } from "../contexts/SessionUIContext";
import { useTabOverlay } from "../contexts/TabOverlayContext";
import { accuracyPerMeasure } from "../utils/measureAccuracy";
import { AlphaTabScoreViewer } from "./AlphaTabScoreViewer";
import { alphaTexStaffHeader } from "./AlphaTabScoreViewer/tablatureToAlphaTex";
import { LearnModeBar } from "./LearnModeBar";
import { MicHud } from "./MicHud";
import { TablatureMinimapBar } from "./TablatureMinimapBar";
import {
  NOTE_SPACING_MAX,
  NOTE_SPACING_MIN,
  useTablatureSettings,
  useTablatureStyle,
} from "./tablatureSettings";
import { TablatureSettingsDialog } from "./TablatureSettingsDialog";
import { tuningGutterStrings } from "./tablatureStringRows";
import { TablatureViewer } from "./TablatureViewer";
import { useAutoTabZoom } from "./useAutoTabZoom";
import {
  TablatureResizeHandle,
  useTablatureHeight,
} from "./useTablatureHeight";
import { useTablatureRenderData } from "./useTablatureRenderData";
import type { TuningGutterString } from "./useTablatureWorkerBridge";

// The floating control and the "Note spacing" slider in settings drive one and
// the same stored value, so the two can never disagree.
const ZOOM_STEP = 0.05;

const clampZoom = (z: number) =>
  Math.round(Math.min(NOTE_SPACING_MAX, Math.max(NOTE_SPACING_MIN, z)) * 100) /
  100;

/** The small pressable chips beside the tab, matched to BackingTrackButton. */
const TOOL_CHIP = cn(
  buttonVariants({ variant: "subtle", size: "sm" }),
  "justify-start gap-1.5 [&_svg]:size-3.5",
);

/** Keys floating over the notation: an opaque face, so the tab can't show through. */
const tabKey = (size: "default" | "icon") =>
  cn(
    buttonVariants({ variant: "subtle", size }),
    "bg-zinc-800 hover:bg-zinc-700 [&_svg]:size-3.5",
  );

interface TablatureSectionProps {
  /** The fitted note spacing and any later change to it are remembered under this. */
  exerciseId?: string;
  activeTablature: TablatureMeasure[];
  rawGpFile?: File;
  /** Tempo baked into the generated alphaTex when there's no rawGpFile (ignored otherwise). */
  baseTempo?: number;
  showAlphaTabScore: boolean;
  /** Cinema mode: the backing video plays behind the notation, so the board
   *  turns translucent instead of hiding it. */
  cinema?: boolean;
  /** Song practice only: the backing track's state and the way into its
   *  editor, shown as a button under Calibrate timing. */
  backingTrackStatus?: BackingTrackStatus;
  onOpenBackingTrack?: () => void;
  isAudioPlaying: boolean;
  onSeek?: (beatPosition: number) => void;
  onLoopRestart?: (loopStartBeat: number) => void;
  startTime: number | null;
  effectiveBpm: number;
  isAudioMuted: boolean;
  isMetronomeMuted: boolean;
  /** Session metronome level (0..1) — forwarded to the notation viewer, whose own
   *  AlphaTab click is the only one audible while notation is shown. */
  metronomeVolume?: number;
  /** Overall boost on top of every track's own volume (1 = normal, up to 2 = +100%). */
  masterVolume?: number;
  /** Per-track mute/volume for the notation viewer's underlying synth — MUST be memoized by the caller. */
  trackConfigs?: Record<string, { volume: number; isMuted: boolean }>;
  /** Dynamic backing-track ids, used to map `trackConfigs` onto the score's tracks — MUST be memoized by the caller. */
  backingTrackIds?: string[];
  isMetronomePlaying: boolean;
  countInRemaining: number;
  frequencyRef?: React.MutableRefObject<number>;
  isListening: boolean;
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  tabResetKey: number;
  hideNotes?: boolean;
  hideDynamicsLane: boolean;
  volumeRef?: React.MutableRefObject<number>;
  isExamMode?: boolean;
  /** Docks the score/combo HUD next to the minimap instead of floating it above the card. */
  isMicEnabled?: boolean;
  /**
   * An opaque full-screen surface — today the backing-track alignment screen —
   * is covering the session.
   *
   * Playback carries on underneath (the alignment screen is precisely where you
   * listen to the two against each other), but every pixel this section draws
   * while that is true is a pixel nobody can see. So the drawing stops and only
   * the sound goes on.
   */
  obscured?: boolean;
}

interface TablatureZoomControlProps {
  zoom: number;
  /** Spacing fitted to the exercise — where the reset goes back to. */
  resetTo: number;
  onChange: (next: number) => void;
}

/** Floating zoom control over the tablature — compress the score to see more at once, or enlarge it. */
function TablatureZoomControl({ zoom, resetTo, onChange }: TablatureZoomControlProps) {
  const { t } = useTranslation("session");
  const atMin = zoom <= NOTE_SPACING_MIN + 1e-6;
  const atMax = zoom >= NOTE_SPACING_MAX - 1e-6;

  return (
    <div className='flex items-center gap-1'>
      <button
        type='button'
        onClick={() => onChange(zoom - ZOOM_STEP)}
        disabled={atMin}
        title={t("tab.zoom_out_hint")}
        aria-label={t("tab.zoom_out")}
        className={tabKey("icon")}>
        <ZoomOut className='h-3.5 w-3.5' />
      </button>
      <button
        type='button'
        onClick={() => onChange(resetTo)}
        title={t("tab.reset_zoom")}
        aria-label={t("tab.reset_zoom")}
        // A readout between the keys, not a key itself; a click still resets.
        className='font-mono min-w-[3rem] rounded px-1 text-center text-[11px] font-semibold tabular-nums text-zinc-300 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring hover:text-white'>
        {Math.round(zoom * 100)}%
      </button>
      <button
        type='button'
        onClick={() => onChange(zoom + ZOOM_STEP)}
        disabled={atMax}
        title={t("tab.zoom_in_hint")}
        aria-label={t("tab.zoom_in")}
        className={tabKey("icon")}>
        <ZoomIn className='h-3.5 w-3.5' />
      </button>
    </div>
  );
}

/** Opens the full tablature personalisation dialog. */
function TablatureSettingsButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation("session");
  return (
    <button
      type='button'
      onClick={onOpen}
      title={t("tab.settings")}
      aria-label={t("tab.settings")}
      className={cn(tabKey("default"), "h-9 gap-1.5 px-2.5")}>
      <Settings2 className='h-3.5 w-3.5 shrink-0' />
      <span className='text-[11px] font-semibold'>{t("tab.look")}</span>
    </button>
  );
}

export const TablatureSection = memo(function TablatureSection({
  exerciseId,
  activeTablature,
  rawGpFile,
  baseTempo,
  showAlphaTabScore,
  cinema = false,
  backingTrackStatus,
  onOpenBackingTrack,
  isAudioPlaying,
  onSeek,
  onLoopRestart,
  startTime,
  effectiveBpm,
  isAudioMuted,
  isMetronomeMuted,
  metronomeVolume,
  masterVolume = 1,
  trackConfigs,
  backingTrackIds,
  isMetronomePlaying,
  countInRemaining,
  frequencyRef,
  isListening,
  audioContext,
  audioStartTime,
  tabResetKey,
  hideNotes,
  hideDynamicsLane,
  volumeRef,
  isExamMode = false,
  isMicEnabled = false,
  obscured = false,
}: TablatureSectionProps) {
  const { t } = useTranslation("session");
  const { overlay: tabOverlay, gameMode } = useTabOverlay();
  const { hitNotes, missedNotes, noteTimings, livePitchRef, fillFeedRef, learn, markAlphaTabPassStart } = useNoteMatchingContext();
  const { openTimingCalibration } = useSessionUI();
  const { tuning, stringCount } = useGuitarTuningContext();
  const {
    settings,
    palette,
    isLightBoard,
    style: tabStyle,
  } = useTablatureStyle();
  const renderData = useTablatureRenderData(
    activeTablature,
    palette,
    settings.stringSpacing,
    settings.flipStrings,
  );
  const { measureEndXs, totalBeats } = renderData;

  // Left-gutter tuning legend for the flat tab: each string's tuned note under
  // the active tuning.
  // The worker decides which strings light up live from the playback cursor.
  const tuningStrings = useMemo<TuningGutterString[]>(() => {
    // Empty list = no gutter drawn and no content inset, which is exactly what
    // turning the gutter off should do — no worker-side flag needed.
    if (!settings.showTuningGutter) return [];
    return tuningGutterStrings(tuning.notation, stringCount, palette);
  }, [tuning.notation, stringCount, palette, settings.showTuningGutter]);

  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  /**
   * The live playhead, in beats.
   *
   * This used to be state, written from an animation frame — so every frame of
   * every session re-rendered this section, the minimap and the tab viewer, all
   * to move a cursor a couple of pixels. It is a ref now: the minimap reads it
   * per frame and writes the DOM itself, and React never hears about it.
   */
  const currentBeatRef = useRef(0);
  /**
   * Where the playhead came to rest — after a seek, a reset, or a pause.
   *
   * Only these moments need a render: they are the ones that move the cursor
   * with no animation loop running, and the only ones anything else in the tree
   * (the "From the start" button) cares about. There are a handful per session.
   */
  const [restingBeat, setRestingBeat] = useState(0);
  const settleBeat = useCallback((beat: number) => {
    currentBeatRef.current = beat;
    setRestingBeat(beat);
  }, []);
  // Horizontal spread lives in the settings store as "Note spacing", so this
  // floating control and the slider on the settings page stay in lockstep.
  const zoom = settings.noteSpacing;
  const setSetting = useTablatureSettings((s) => s.set);
  // Shared viewer height (tab / notation), persisted to localStorage.
  const { height, setHeight } = useTablatureHeight();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleZoomChange = useCallback(
    (next: number) => setSetting("noteSpacing", clampZoom(next)),
    [setSetting],
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const fitZoom = useAutoTabZoom({
    storageKey: exerciseId,
    measures: activeTablature,
    bpm: effectiveBpm,
    boardRef,
    viewerHeight: height,
    enabled: !showAlphaTabScore,
  });
  const seekedBeatRef = useRef(0);
  const isRestartingRef = useRef(false);
  // Populated by TablatureViewer so minimap clicks can update the canvas cursor
  const seekWorkerRef = useRef<((beat: number, smooth?: boolean) => void) | null>(null);
  // Populated by TablatureViewer with its CSS container width (used by its own auto-scroll)
  const viewerWidthRef = useRef(0);

  // Wrap onSeek to track the last seeked beat for minimap cursor and sync the worker canvas
  const handleSeek = useCallback(
    (beat: number) => {
      seekedBeatRef.current = beat;
      settleBeat(beat);
      seekWorkerRef.current?.(beat);
      onSeek?.(beat);
    },
    [onSeek, settleBeat],
  );

  // Advance the playhead via rAF while playing; also triggers loop restart when
  // end is reached. The position lands in a ref — the minimap paints itself off
  // it — so this loop costs one subtraction and no render at all.
  useEffect(() => {
    isRestartingRef.current = false; // clear guard on every effect re-run (new play session)
    if (!isMetronomePlaying || !startTime || countInRemaining > 0) {
      settleBeat(seekedBeatRef.current);
      return;
    }
    let rafId: number;
    const tick = () => {
      // The metronome back-dates startTime by the seeked position, so elapsed
      // already measures from beat 0 — adding seekedBeatRef here would double-count.
      const elapsed = (Date.now() - startTime!) / 1000;
      const rawBeats = elapsed * (effectiveBpm / 60);

      // Loop restart: fire once when cursor crosses loopEnd
      if (
        !isRestartingRef.current &&
        onLoopRestart &&
        loopStart !== null &&
        loopEnd !== null &&
        loopEnd > loopStart &&
        rawBeats >= loopEnd
      ) {
        isRestartingRef.current = true;
        seekedBeatRef.current = loopStart;
        onLoopRestart(loopStart);
        return; // stop this rAF frame; effect will restart after metronome cycles
      }

      let beat: number;
      if (
        loopStart !== null &&
        loopEnd !== null &&
        loopEnd > loopStart &&
        rawBeats >= loopStart
      ) {
        const loopDur = loopEnd - loopStart;
        const relBeat = rawBeats - loopStart;
        beat = loopStart + (relBeat % loopDur);
      } else {
        beat = totalBeats > 0 ? rawBeats % totalBeats : 0;
      }
      // Track the displayed position so pausing / count-in / restart bridging
      // (the early-return branch above) resumes from where the cursor actually is.
      seekedBeatRef.current = beat;
      currentBeatRef.current = beat;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    isMetronomePlaying,
    startTime,
    effectiveBpm,
    totalBeats,
    countInRemaining,
    loopStart,
    loopEnd,
    onLoopRestart,
    settleBeat,
  ]);

  // Reset loop + beat when exercise changes
  useEffect(() => {
    seekedBeatRef.current = 0;
    setLoopStart(null);
    setLoopEnd(null);
    settleBeat(0);
  }, [tabResetKey, settleBeat]);

  // Learn mode keeps no time, so nothing moves the cursor: park it on the note
  // the lesson is waiting for. The metronome stays out of it (no onSeek).
  const learnBeat = learn?.enabled ? learn.cursorBeat : null;
  useEffect(() => {
    if (learnBeat === null) return;
    seekedBeatRef.current = learnBeat;
    currentBeatRef.current = learnBeat;
    seekWorkerRef.current?.(learnBeat, true);
  }, [learnBeat, tabResetKey, showAlphaTabScore]);
  // Where the cursor rests, as far as the minimap and the "From the start"
  // button are concerned: the lesson's note, or wherever the player last left it.
  const shownBeat = learnBeat ?? restingBeat;

  const showMinimap =
    !isExamMode && activeTablature.length > 3 && measureEndXs.length > 0;
  const canShowAlphaTabScore = !!rawGpFile || activeTablature.length > 0;

  // Once opened, keep AlphaTabScoreViewer mounted (just hidden) instead of tearing it down
  // whenever the user flips back to the tab view. Fully unmounting/remounting the AlphaTab
  // instance on every toggle raced its own async ready/teardown sequence — after a couple of
  // rapid switches, playback silently stopped resuming. Hiding via CSS keeps the same
  // AlphaTabApi instance alive, so toggling mid-playback is just a play()/stop() call, not a
  // fresh load. Resets per exercise so we don't eagerly load notation the user never opens.
  const [scoreEverShown, setScoreEverShown] = useState(showAlphaTabScore);
  const [prevResetKey, setPrevResetKey] = useState(tabResetKey);
  // Adjust state during render (React's documented pattern for "reset on prop change")
  // rather than in an effect — avoids an extra render pass and the cascading-setState lint rule.
  if (prevResetKey !== tabResetKey) {
    setPrevResetKey(tabResetKey);
    setScoreEverShown(showAlphaTabScore);
  } else if (showAlphaTabScore && !scoreEverShown) {
    setScoreEverShown(true);
  }

  // Per-measure pitch-detect accuracy (mic mode only): share of that measure's
  // notes played correctly so far, keyed the same way as hitNotes/missedNotes
  // (`${measureIdx}-${beatIdx}-${noteIdx}`) so no extra bookkeeping is needed.
  // null = the loop hasn't reached that measure yet this pass, so the nav cell
  // stays unfilled instead of reading as a 0%.
  const measureAccuracy = useMemo<(number | null)[] | undefined>(
    () => (isMicEnabled ? accuracyPerMeasure(activeTablature, hitNotes, missedNotes) : undefined),
    [activeTablature, hitNotes, missedNotes, isMicEnabled],
  );

  // Cinema keeps the picture clear of the backing track's own chrome.
  const showBackingButton = !!backingTrackStatus && !!onOpenBackingTrack && !cinema;

  // Song navigator strip — shared between the score (notation) view and the
  // canvas tab view, since both drive the same seek/loop wiring off `activeTablature`.
  const minimapRow = (showMinimap || isMicEnabled || showBackingButton) && (
    <div
      className={cn(
        "flex items-center gap-6",
        // Cinema pins the tab to the bottom edge, so the bar navigator and the
        // score go to the opposite one rather than floating in the picture.
        // pt clears the Electron titlebar, which is portalled above this.
        cinema && "fixed inset-x-0 top-0 z-20 px-6 pb-3 pt-12",
      )}>
      <div className='min-w-0 flex-1'>
        {showMinimap && (
          <TablatureMinimapBar
            measureEndXs={measureEndXs}
            totalBeats={totalBeats}
            currentBeatRef={currentBeatRef}
            beatVersion={shownBeat}
            loopStart={loopStart}
            loopEnd={loopEnd}
            isPlaying={isMetronomePlaying && countInRemaining === 0}
            paused={obscured}
            measureAccuracy={measureAccuracy}
            onSeek={handleSeek}
            onLoopRangeChange={(s, e) => {
              setLoopStart(s);
              setLoopEnd(e);
            }}
          />
        )}
      </div>
      {/* Fixed slot: showing/hiding the button must not resize the strip. */}
      <div className='flex w-[116px] shrink-0 justify-end'>
        {loopStart !== null && loopEnd !== null && (
          <button
            onClick={() => {
              setLoopStart(null);
              setLoopEnd(null);
            }}
            title={t("tab.remove_loop")}
            className={TOOL_CHIP}>
            <X className='h-3.5 w-3.5' />
            <span>{t("tab.clear_loop")}</span>
          </button>
        )}
      </div>
      {(isMicEnabled || showBackingButton) && (
        // One column, so the sync tools read as a pair and share a width.
        <div className='flex shrink-0 flex-col items-stretch gap-2'>
          {isMicEnabled && (
            <button
              type='button'
              onClick={openTimingCalibration}
              title={t("tab.calibrate_hint")}
              className={cn(TOOL_CHIP, "shrink-0")}>
              <Timer className='h-3.5 w-3.5' />
              <span>{t("timing.title")}</span>
            </button>
          )}
          {showBackingButton && backingTrackStatus && onOpenBackingTrack && (
            <BackingTrackButton status={backingTrackStatus} onClick={onOpenBackingTrack} />
          )}
        </div>
      )}
      {isMicEnabled && !gameMode && <MicHud className='mr-1' />}
    </div>
  );

  return (
    <div
      className={cn(
        "relative w-full rounded-lg",
        // Cinema pins the board to the bottom edge and drops its panel entirely,
        // so the picture owns the whole frame and only the notation sits on it.
        // pb clears the session's bottom bar (fixed, ~65px tall).
        cinema
          ? "fixed inset-x-0 bottom-0 z-20 mb-0 bg-transparent px-6 pb-[80px]"
          : "mb-4 bg-[#0f0f12]",
      )}>
      {canShowAlphaTabScore && scoreEverShown && (
        <div
          className={showAlphaTabScore ? undefined : "hidden"}
          // AlphaTab draws the score as SVG and sweeps a cursor across it every
          // frame. Under the alignment screen that is a full-page SVG repaint
          // nobody can see — but this same player is also making the sound being
          // aligned against, so it must keep playing. `visibility` skips the
          // paint while leaving the audio, and the layout AlphaTab renders
          // itself into, exactly as they were.
          style={obscured ? { visibility: "hidden" } : undefined}>
          {minimapRow && <div className='px-2 pt-0'>{minimapRow}</div>}
          <AlphaTabScoreViewer
            rawGpFile={rawGpFile}
            measures={activeTablature}
            baseTempo={baseTempo}
            staffHeader={alphaTexStaffHeader(tuning)}
            mode='score'
            isPlaying={isAudioPlaying && showAlphaTabScore}
            countInRemaining={countInRemaining}
            startTime={startTime}
            bpm={effectiveBpm}
            volume={isAudioMuted ? 0 : masterVolume}
            isMetronomeMuted={isMetronomeMuted}
            metronomeVolume={metronomeVolume}
            trackConfigs={trackConfigs}
            backingTrackIds={backingTrackIds}
            className='w-full'
            hitNotes={hitNotes}
            missedNotes={missedNotes}
            onLoopRestart={markAlphaTabPassStart}
            heightPx={height}
            resizeHandle={
              <TablatureResizeHandle height={height} onChange={setHeight} />
            }
          />
        </div>
      )}
      {!showAlphaTabScore && (
        <div className='px-2 pt-0'>
          {minimapRow}
          <LearnModeBar />
          <div ref={boardRef} className='relative'>
            {tabOverlay}
            <TablatureViewer
              measures={activeTablature}
              bpm={effectiveBpm}
              isPlaying={isMetronomePlaying}
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
              hideNotes={hideNotes}
              audioContext={audioContext}
              audioStartTime={audioStartTime}
              resetKey={tabResetKey}
              hideDynamicsLane={hideDynamicsLane}
              volumeRef={volumeRef}
              onSeek={handleSeek}
              currentBeat={shownBeat}
              obscured={obscured}
              loopStartBeat={loopStart}
              loopEndBeat={loopEnd}
              seekWorkerRef={seekWorkerRef}
              learnFocus={learn?.enabled ? learn.focus : null}
              viewerWidthRef={viewerWidthRef}
              zoom={zoom}
              heightPx={height}
              tuningStrings={tuningStrings}
              stringCount={stringCount}
              style={tabStyle}
              cinema={cinema}
              ambientGlow={settings.ambientGlow}
              palette={palette}
              isLightBoard={isLightBoard}
            />
            <div className='absolute bottom-3 right-3 z-20 flex items-center gap-2'>
              <TablatureSettingsButton onOpen={() => setIsSettingsOpen(true)} />
              <TablatureZoomControl
                zoom={zoom}
                resetTo={fitZoom}
                onChange={handleZoomChange}
              />
            </div>
            <TablatureResizeHandle height={height} onChange={setHeight} />
          </div>
        </div>
      )}

      <TablatureSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
});
