import { Settings2, ZoomIn, ZoomOut } from "lucide-react";
import React, { memo, useCallback, useMemo, useState } from "react";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
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
import type { TuningGutterString } from "./useTablatureWorkerBridge";

/**
 * Phones hit the 120px/beat floor of the beat-width formula, which shows barely
 * ~1 measure at the stored spacing. Everything the user picks is scaled by this
 * so "100%" on a phone still fits roughly a third more tab than the desktop
 * default would, and zooming from there behaves the same on both.
 */
const MOBILE_FIT = 0.75;
const ZOOM_STEP = 0.25;

/** Own height slot — a 600px desktop viewer would swallow a whole phone screen. */
const MOBILE_HEIGHT_KEY = "practice-tab-height-mobile";
const MOBILE_HEIGHT_MIN = 180;
const MOBILE_HEIGHT_MAX = 460;

const clampZoom = (z: number) =>
  Math.round(Math.min(NOTE_SPACING_MAX, Math.max(NOTE_SPACING_MIN, z)) * 100) /
  100;

interface MobileTablaturePanelProps {
  measures: TablatureMeasure[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  countInRemaining?: number;
  frequencyRef?: React.MutableRefObject<number>;
  isListening?: boolean;
  resetKey: number;
}

/**
 * Tablature card for the phone session view. Same personalisation store as the
 * desktop TablatureSection — board colours, pill shape, palette, lanes — plus
 * touch-sized zoom steps and a drag handle for the viewer height.
 */
export const MobileTablaturePanel = memo(function MobileTablaturePanel({
  measures,
  bpm,
  isPlaying,
  startTime,
  countInRemaining,
  frequencyRef,
  isListening,
  resetKey,
}: MobileTablaturePanelProps) {
  const { hitNotes, missedNotes } = useNoteMatchingContext();
  const { tuning } = useGuitarTuningContext();
  const {
    settings,
    palette,
    background,
    isLightBoard,
    style,
  } = useTablatureStyle();
  const setSetting = useTablatureSettings((s) => s.set);
  const { height, setHeight } = useTablatureHeight({
    storageKey: MOBILE_HEIGHT_KEY,
    min: MOBILE_HEIGHT_MIN,
    max: MOBILE_HEIGHT_MAX,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const zoom = settings.noteSpacing;
  const handleZoomChange = useCallback(
    (next: number) => setSetting("noteSpacing", clampZoom(next)),
    [setSetting]
  );

  // Left-gutter tuning legend, same mapping as the desktop section: the notation
  // runs low→high, so index 0 is string 6.
  const tuningStrings = useMemo<TuningGutterString[]>(() => {
    if (!settings.showTuningGutter) return [];
    const names = tuning.notation.split(/\s+/);
    return [1, 2, 3, 4, 5, 6].map((string) => ({
      string,
      label: names[6 - string] ?? "",
      color: palette[string - 1] ?? "#ffffff",
    }));
  }, [tuning.notation, palette, settings.showTuningGutter]);

  const atMin = zoom <= NOTE_SPACING_MIN + 1e-6;
  const atMax = zoom >= NOTE_SPACING_MAX - 1e-6;
  const zoomBtn =
    "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors active:bg-white/10 disabled:opacity-30";

  return (
    <div
      className='w-full overflow-hidden rounded-2xl shadow-lg'
      style={{ backgroundColor: background }}>
      <div className='relative'>
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
          currentBeatsElapsed={0}
          resetKey={resetKey}
          zoom={zoom * MOBILE_FIT}
          heightPx={height}
          tuningStrings={tuningStrings}
          style={style}
          ambientGlow={settings.ambientGlow}
          palette={palette}
          isLightBoard={isLightBoard}
        />
        <TablatureResizeHandle height={height} onChange={setHeight} />
      </div>

      {/* Controls sit under the board rather than floating over it — on a phone
          there is no spare canvas to cover without hiding notes. */}
      <div className='flex items-center justify-between gap-2 bg-black/40 px-2 py-1.5'>
        <button
          type='button'
          onClick={() => setIsSettingsOpen(true)}
          aria-label='Tablature settings'
          className='flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-zinc-300 transition-colors active:bg-white/10'>
          <Settings2 className='h-4 w-4 shrink-0' />
          <span className='text-xs font-semibold'>Look</span>
        </button>

        <div className='flex items-center gap-0.5'>
          <button
            type='button'
            onClick={() => handleZoomChange(zoom - ZOOM_STEP)}
            disabled={atMin}
            aria-label='Zoom out'
            className={zoomBtn}>
            <ZoomOut className='h-4 w-4' />
          </button>
          <button
            type='button'
            onClick={() => handleZoomChange(1)}
            aria-label='Reset zoom'
            className='font-mono min-w-[3.25rem] rounded-lg px-1.5 py-2 text-center text-xs font-semibold tabular-nums text-zinc-300 transition-colors active:bg-white/10'>
            {Math.round(zoom * 100)}%
          </button>
          <button
            type='button'
            onClick={() => handleZoomChange(zoom + ZOOM_STEP)}
            disabled={atMax}
            aria-label='Zoom in'
            className={zoomBtn}>
            <ZoomIn className='h-4 w-4' />
          </button>
        </div>
      </div>

      <TablatureSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
});
