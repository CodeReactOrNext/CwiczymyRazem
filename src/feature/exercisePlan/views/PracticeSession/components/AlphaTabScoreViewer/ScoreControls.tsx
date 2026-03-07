import { cn } from "assets/lib/utils";
import { FaMusic } from "react-icons/fa";
import { MdSpeed } from "react-icons/md";

export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

interface ScoreControlsProps {
  currentMs: number;
  totalMs: number;
  uiReady: boolean;
  uiPlaying: boolean;
  isLooping: boolean;
  metronomeOn: boolean;
  speedIdx: number;
  onLoopToggle: () => void;
  onMetronomeToggle: () => void;
  onSpeedChange: (dir: 1 | -1) => void;
}

/**
 * Progress bar + supplementary controls (loop, metronome, speed multiplier).
 * Play/pause/BPM are intentionally absent — those live in the session UI.
 */
export const ScoreControls = ({
  currentMs,
  totalMs,
  uiReady,
  uiPlaying,
  isLooping,
  metronomeOn,
  speedIdx,
  onLoopToggle,
  onMetronomeToggle,
  onSpeedChange,
}: ScoreControlsProps) => {
  const progress = totalMs > 0 ? (currentMs / totalMs) * 100 : 0;

  return (
    <>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-400 tabular-nums w-10 text-right">
          {formatTime(currentMs)}
        </span>
        <div className="relative flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-blue-500 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-zinc-400 tabular-nums w-10">
          {formatTime(totalMs)}
        </span>

        {!uiReady && (
          <span className="text-[10px] text-zinc-500 animate-pulse">Ładowanie…</span>
        )}
        {uiReady && uiPlaying && (
          <span className="text-[10px] text-blue-400">▶</span>
        )}
      </div>

      {/* Extra controls */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 shrink-0">Notacja:</span>

        {/* Loop */}
        <button
          onClick={onLoopToggle}
          disabled={!uiReady}
          title="Pętla"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors disabled:opacity-40",
            isLooping ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600",
          )}
        >
          ↻
        </button>

        {/* Metronome */}
        <button
          onClick={onMetronomeToggle}
          disabled={!uiReady}
          title="Metronom"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-40",
            metronomeOn ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600",
          )}
        >
          <FaMusic size={8} />
        </button>

        {/* Speed multiplier (stacks on top of session BPM) */}
        <div className="ml-auto flex items-center gap-1">
          <MdSpeed size={12} className="text-zinc-500" />
          <button
            onClick={() => onSpeedChange(-1)}
            disabled={!uiReady || speedIdx === 0}
            className="h-5 w-5 flex items-center justify-center rounded bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-30 text-xs"
          >
            −
          </button>
          <span className="text-[10px] text-zinc-400 tabular-nums w-8 text-center">
            {SPEEDS[speedIdx]}×
          </span>
          <button
            onClick={() => onSpeedChange(1)}
            disabled={!uiReady || speedIdx === SPEEDS.length - 1}
            className="h-5 w-5 flex items-center justify-center rounded bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-30 text-xs"
          >
            +
          </button>
        </div>
      </div>
    </>
  );
};
