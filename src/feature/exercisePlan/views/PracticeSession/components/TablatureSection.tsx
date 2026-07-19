import { Settings2, X, ZoomIn, ZoomOut } from "lucide-react";
import dynamic from "next/dynamic";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { STANDARD_TUNING_ID } from "utils/audio/tunings";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { AlphaTabScoreViewer } from "./AlphaTabScoreViewer";
import { MicHud } from "./MicHud";
import { TablatureMinimapBar } from "./TablatureMinimapBar";
import {
  NOTE_SPACING_MAX,
  NOTE_SPACING_MIN,
  useTablatureSettings,
  useTablatureStyle,
} from "./tablatureSettings";
import { TablatureSettingsDialog } from "./TablatureSettingsDialog";
import { TablatureViewer } from "./TablatureViewer";
import {
  TablatureResizeHandle,
  useTablatureHeight,
} from "./useTablatureHeight";
import { useTablatureRenderData } from "./useTablatureRenderData";
import type { TuningGutterString } from "./useTablatureWorkerBridge";

// three.js is only pulled in when the user actually switches to the 3D highway,
// keeping it out of the main bundle. ssr:false — the scene touches `window`.
const NoteHighway3D = dynamic(
  () => import("./NoteHighway3D").then((m) => m.NoteHighway3D),
  { ssr: false },
);

// The floating control and the "Note spacing" slider in settings drive one and
// the same stored value, so the two can never disagree.
const ZOOM_STEP = 0.25;

const clampZoom = (z: number) =>
  Math.round(Math.min(NOTE_SPACING_MAX, Math.max(NOTE_SPACING_MIN, z)) * 100) /
  100;

interface TablatureSectionProps {
  activeTablature: TablatureMeasure[];
  rawGpFile?: File;
  /** Tempo baked into the generated alphaTex when there's no rawGpFile (ignored otherwise). */
  baseTempo?: number;
  showAlphaTabScore: boolean;
  show3dHighway?: boolean;
  isAudioPlaying: boolean;
  onSeek?: (beatPosition: number) => void;
  onLoopRestart?: (loopStartBeat: number) => void;
  startTime: number | null;
  effectiveBpm: number;
  isAudioMuted: boolean;
  isMetronomeMuted: boolean;
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
  /** Exercise/song title — shown top-left when the 3D highway goes full screen. */
  title?: string;
  /** Song cover art (only set when practicing a song that has one assigned). */
  coverUrl?: string;
  /** Artist name — only set (alongside coverUrl) when practicing a song. */
  subtitle?: string;
}

interface TablatureZoomControlProps {
  zoom: number;
  onChange: (next: number) => void;
}

/** Floating zoom control over the tablature — compress the score to see more at once, or enlarge it. */
function TablatureZoomControl({ zoom, onChange }: TablatureZoomControlProps) {
  const atMin = zoom <= NOTE_SPACING_MIN + 1e-6;
  const atMax = zoom >= NOTE_SPACING_MAX - 1e-6;
  const btn =
    "flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className='flex items-center gap-0.5 rounded-lg border border-white/10 bg-zinc-900/85 px-1 py-1 backdrop-blur-sm'>
      <button
        type='button'
        onClick={() => onChange(zoom - ZOOM_STEP)}
        disabled={atMin}
        title='Zoom out — see more of the exercise'
        aria-label='Zoom out'
        className={btn}>
        <ZoomOut className='h-3.5 w-3.5' />
      </button>
      <button
        type='button'
        onClick={() => onChange(1)}
        title='Reset zoom'
        aria-label='Reset zoom'
        className='font-mono min-w-[3rem] rounded-md px-1.5 text-center text-[11px] font-semibold tabular-nums text-zinc-300 transition-colors hover:bg-white/10 hover:text-white'>
        {Math.round(zoom * 100)}%
      </button>
      <button
        type='button'
        onClick={() => onChange(zoom + ZOOM_STEP)}
        disabled={atMax}
        title='Zoom in — enlarge the notes'
        aria-label='Zoom in'
        className={btn}>
        <ZoomIn className='h-3.5 w-3.5' />
      </button>
    </div>
  );
}

/** Opens the full tablature personalisation dialog. */
function TablatureSettingsButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type='button'
      onClick={onOpen}
      title='Tablature settings'
      aria-label='Tablature settings'
      className='flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/85 px-2.5 text-zinc-300 outline-none backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50 hover:bg-zinc-800 hover:text-white'>
      <Settings2 className='h-3.5 w-3.5 shrink-0' />
      <span className='text-[11px] font-semibold'>Look</span>
    </button>
  );
}

export const TablatureSection = memo(function TablatureSection({
  activeTablature,
  rawGpFile,
  baseTempo,
  showAlphaTabScore,
  show3dHighway = false,
  isAudioPlaying,
  onSeek,
  onLoopRestart,
  startTime,
  effectiveBpm,
  isAudioMuted,
  isMetronomeMuted,
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
  title,
  coverUrl,
  subtitle,
}: TablatureSectionProps) {
  const { hitNotes, missedNotes } = useNoteMatchingContext();
  const { tuning } = useGuitarTuningContext();
  // "E Standard" reads better than the bare preset name for the default tuning;
  // every alternate tuning's own name (e.g. "Drop D") is already descriptive.
  const tuningLabel =
    tuning.id === STANDARD_TUNING_ID
      ? `${tuning.notation.split(/\s+/)[0]} ${tuning.name}`
      : tuning.name;
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
  );
  const { measureEndXs, totalBeats } = renderData;

  // Left-gutter tuning legend for the flat tab: each string's tuned note under
  // the active tuning (notation is low→high, so index 0 = string 6 … 5 = string 1).
  // The worker decides which strings light up live from the playback cursor.
  const tuningStrings = useMemo<TuningGutterString[]>(() => {
    // Empty list = no gutter drawn and no content inset, which is exactly what
    // turning the gutter off should do — no worker-side flag needed.
    if (!settings.showTuningGutter) return [];
    const names = tuning.notation.split(/\s+/);
    return [1, 2, 3, 4, 5, 6].map((string) => ({
      string,
      label: names[6 - string] ?? "",
      color: palette[string - 1] ?? "#ffffff",
    }));
  }, [tuning.notation, palette, settings.showTuningGutter]);

  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  // Horizontal spread lives in the settings store as "Note spacing", so this
  // floating control and the slider on the settings page stay in lockstep.
  const zoom = settings.noteSpacing;
  const setSetting = useTablatureSettings((s) => s.set);
  // Shared viewer height (tab / notation / 3D), persisted to localStorage.
  const { height, setHeight } = useTablatureHeight();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleZoomChange = useCallback(
    (next: number) => setSetting("noteSpacing", clampZoom(next)),
    [setSetting],
  );
  const seekedBeatRef = useRef(0);
  const isRestartingRef = useRef(false);
  // Populated by TablatureViewer so minimap clicks can update the canvas cursor
  const seekWorkerRef = useRef<((beat: number) => void) | null>(null);
  // Populated by TablatureViewer with its CSS container width (used by its own auto-scroll)
  const viewerWidthRef = useRef(0);

  // Wrap onSeek to track the last seeked beat for minimap cursor and sync the worker canvas
  const handleSeek = useCallback(
    (beat: number) => {
      seekedBeatRef.current = beat;
      setCurrentBeat(beat);
      seekWorkerRef.current?.(beat);
      onSeek?.(beat);
    },
    [onSeek],
  );

  // Update minimap playhead via rAF while playing; also triggers loop restart when end is reached
  useEffect(() => {
    isRestartingRef.current = false; // clear guard on every effect re-run (new play session)
    if (!isMetronomePlaying || !startTime || countInRemaining > 0) {
      setCurrentBeat(seekedBeatRef.current);
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
      setCurrentBeat(beat);
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
  ]);

  // Reset loop + beat when exercise changes
  useEffect(() => {
    seekedBeatRef.current = 0;
    setLoopStart(null);
    setLoopEnd(null);
    setCurrentBeat(0);
  }, [tabResetKey]);

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

  // Song navigator strip — shared between the score (notation) view and the
  // canvas tab view, since both drive the same seek/loop wiring off `activeTablature`.
  const minimapRow = (showMinimap || isMicEnabled) && (
    <div className='flex items-center gap-6'>
      <div className='min-w-0 flex-1'>
        {showMinimap && (
          <TablatureMinimapBar
            measureEndXs={measureEndXs}
            totalBeats={totalBeats}
            currentBeat={currentBeat}
            loopStart={loopStart}
            loopEnd={loopEnd}
            isPlaying={isMetronomePlaying && countInRemaining === 0}
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
            title='Remove the loop'
            className='flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-100'>
            <X className='h-3.5 w-3.5' />
            <span>Clear loop</span>
          </button>
        )}
      </div>
      {isMicEnabled && <MicHud className='mr-1' />}
    </div>
  );

  return (
    <div className='relative mb-4 w-full rounded-lg bg-[#0f0f12]'>
      {canShowAlphaTabScore && scoreEverShown && (
        <div className={showAlphaTabScore ? undefined : "hidden"}>
          {minimapRow && <div className='px-2 pt-0'>{minimapRow}</div>}
          <AlphaTabScoreViewer
            rawGpFile={rawGpFile}
            measures={activeTablature}
            baseTempo={baseTempo}
            mode='score'
            isPlaying={isAudioPlaying && showAlphaTabScore}
            countInRemaining={countInRemaining}
            startTime={startTime}
            bpm={effectiveBpm}
            volume={isAudioMuted ? 0 : masterVolume}
            isMetronomeMuted={isMetronomeMuted}
            trackConfigs={trackConfigs}
            backingTrackIds={backingTrackIds}
            className='w-full'
            hitNotes={hitNotes}
            missedNotes={missedNotes}
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
          {show3dHighway ? (
            <div className='relative'>
              <NoteHighway3D
                measures={activeTablature}
                resetKey={tabResetKey}
                hideNotes={hideNotes}
                heightPx={height}
                className='w-full overflow-hidden rounded-lg'
                isMicEnabled={isMicEnabled}
                title={title}
                coverUrl={coverUrl}
                subtitle={subtitle}
                tuningLabel={tuningLabel}
                bpm={Math.round(effectiveBpm)}
                countInRemaining={countInRemaining}
                onSeek={handleSeek}
              />
              <TablatureResizeHandle height={height} onChange={setHeight} />
            </div>
          ) : (
            <div className='relative'>
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
                currentBeatsElapsed={0}
                hideNotes={hideNotes}
                audioContext={audioContext}
                audioStartTime={audioStartTime}
                resetKey={tabResetKey}
                hideDynamicsLane={hideDynamicsLane}
                volumeRef={volumeRef}
                onSeek={handleSeek}
                currentBeat={currentBeat}
                loopStartBeat={loopStart}
                loopEndBeat={loopEnd}
                seekWorkerRef={seekWorkerRef}
                viewerWidthRef={viewerWidthRef}
                zoom={zoom}
                heightPx={height}
                tuningStrings={tuningStrings}
                style={tabStyle}
                ambientGlow={settings.ambientGlow}
                palette={palette}
                isLightBoard={isLightBoard}
              />
              <div className='absolute bottom-3 right-3 z-20 flex items-center gap-2'>
                <TablatureSettingsButton
                  onOpen={() => setIsSettingsOpen(true)}
                />
                <TablatureZoomControl zoom={zoom} onChange={handleZoomChange} />
              </div>
              <TablatureResizeHandle height={height} onChange={setHeight} />
            </div>
          )}
        </div>
      )}

      <TablatureSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
});
