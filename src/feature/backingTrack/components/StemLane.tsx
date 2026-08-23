import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { Headphones, Trash2, VolumeX } from "lucide-react";

import { PEAKS_PER_SECOND, useWaveformPeaks } from "../hooks/useWaveformPeaks";
import type { BackingStem } from "../types/backingTrack.types";
import { stemColor } from "../utils/timelineColors";
import { AlignmentGrid } from "./AlignmentGrid";
import type { TimelineWindow } from "./TimelineRuler";

export const TRACK_HEADER_WIDTH = "w-64";

const mixerButton =
  "flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-zinc-100";

interface StemLaneProps extends TimelineWindow {
  stem: BackingStem;
  name: string;
  src: string | null;
  heightPx: number;
  onStemOffsetChange: (next: number, options?: { realign?: boolean }) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onSolo: () => void;
  onRemove: () => void;
  /** Which stem this is, for its waveform colour. */
  index?: number;
  /** Dragged to make the lane taller or shorter; omitted, the lane is fixed. */
  onResize?: (heightPx: number) => void;
  /** What a plain drag across the lane does — see AlignmentGrid.dragMode. */
  dragMode?: "pan" | "stems";
  onPanStart?: (clientX: number) => void;
  onPanMove?: (clientX: number) => void;
  onPanEnd?: () => void;
}

/**
 * One track in the stack: mixer head on the left, its clip on the timeline.
 *
 * Dragging a lane moves *that stem only*. Stems exported together sit at zero
 * and never need it; one sourced separately — a guitar take against a YouTube
 * rip — almost always does, and forcing them to share an offset would make the
 * whole screen useless for that case.
 */
export function StemLane({
  stem,
  name,
  src,
  startTime,
  effectiveBpm,
  scoreClockRef,
  getResumeBeat,
  sourceBpm,
  offsetMs,
  tempoMap,
  beatsPerBar,
  windowSec,
  centreSecOverride,
  heightPx,
  index = 0,
  onResize,
  onStemOffsetChange,
  onVolumeChange,
  onToggleMute,
  onSolo,
  onRemove,
  dragMode,
  onPanStart,
  onPanMove,
  onPanEnd,
}: StemLaneProps) {
  const { peaks, isLoading } = useWaveformPeaks(src);

  return (
    // Same row shape as every other lane on the timeline (see AlignmentScreen's
    // laneRow): a ruled header column, then the lane. Keeping them identical is
    // what makes the track list read as one column rather than a ragged edge.
    <div className='flex items-stretch border-b border-zinc-800'>
      <div
        className={cn(
          TRACK_HEADER_WIDTH,
          "flex shrink-0 flex-col justify-center gap-2 border-r border-zinc-800 bg-zinc-900/60 px-4",
          stem.muted && "opacity-60",
        )}
        style={{ height: heightPx }}>
        {/* The name gets a line to itself: at three buttons on the same row a
            real track title was truncated to about eight characters.

            The dot is what ties the name to the coloured wave beside it. Track
            colour used to live only on the canvas, so a violet waveform and the
            header naming it were connected by nothing but being on one row. */}
        <span className='flex items-center gap-2 truncate' title={name}>
          <span
            aria-hidden
            className='h-2 w-2 shrink-0 rounded-full'
            style={{ backgroundColor: stemColor(index) }}
          />
          <span className='truncate text-sm font-semibold text-zinc-100'>{name}</span>
        </span>

        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={onSolo}
            aria-label={`Solo ${name}`}
            title='Solo'
            className={mixerButton}>
            <Headphones className='h-3.5 w-3.5' />
          </button>
          <button
            type='button'
            onClick={onToggleMute}
            aria-label={stem.muted ? `Unmute ${name}` : `Mute ${name}`}
            title='Mute'
            className={cn(mixerButton, stem.muted && "bg-amber-500/10 text-amber-400")}>
            <VolumeX className='h-3.5 w-3.5' />
          </button>
          <button
            type='button'
            onClick={onRemove}
            aria-label={`Remove ${name} from this song`}
            title='Remove'
            className={mixerButton}>
            <Trash2 className='h-3.5 w-3.5' />
          </button>

          <span
            className={cn(
              "ml-auto text-xs tabular-nums",
              stem.offsetMs === 0 ? "text-zinc-400" : "text-amber-400",
            )}>
            {stem.offsetMs === 0
              ? "On the grid"
              : `${stem.offsetMs > 0 ? "+" : ""}${Math.round(stem.offsetMs)} ms`}
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <Slider
            value={[stem.volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([value]) => onVolumeChange(value)}
            className='flex-1'
          />
          <span className='w-7 shrink-0 text-right text-xs tabular-nums text-zinc-400'>
            {Math.round(stem.volume * 100)}
          </span>
        </div>

      </div>

      <div className='relative min-w-0 flex-1 px-3 py-1'>
        <AlignmentGrid
          peaks={peaks}
          peaksPerSecond={PEAKS_PER_SECOND}
          startTime={startTime}
          effectiveBpm={effectiveBpm}
          scoreClockRef={scoreClockRef}
          getResumeBeat={getResumeBeat}
          sourceBpm={sourceBpm}
          tempoMap={tempoMap}
          waveColor={stemColor(index, stem.muted)}
          offsetMs={offsetMs}
          stemOffsetMs={stem.offsetMs}
          beatsPerBar={beatsPerBar}
          windowSec={windowSec}
          centreSecOverride={centreSecOverride}
          heightPx={heightPx}
          onDragOffset={(deltaMs, options) =>
            onStemOffsetChange(stem.offsetMs + deltaMs, options)
          }
          dragMode={dragMode}
          onPanStart={onPanStart}
          onPanMove={onPanMove}
          onPanEnd={onPanEnd}
        />
        {isLoading && (
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400'>
            Reading waveform…
          </span>
        )}
        {onResize && (
          // A grab strip along the bottom edge, the way a DAW resizes a track.
          <div
            role='separator'
            aria-label={`Resize the ${name} lane`}
            onPointerDown={(event) => {
              event.preventDefault();
              const startY = event.clientY;
              const startHeight = heightPx;
              const move = (e: PointerEvent) =>
                onResize(Math.round(startHeight + (e.clientY - startY)));
              const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }}
            className='absolute inset-x-0 bottom-0 h-2 cursor-ns-resize'
          />
        )}
      </div>
    </div>
  );
}
