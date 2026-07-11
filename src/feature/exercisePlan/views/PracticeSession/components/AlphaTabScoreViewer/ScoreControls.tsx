import { cn } from "assets/lib/utils";

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
  onLoopToggle: () => void;
}

/**
 * Progress bar + supplementary controls (loop).
 * Play/pause/BPM/speed/metronome are intentionally absent — those live in the session UI.
 */
export const ScoreControls = ({
  currentMs,
  totalMs,
  uiReady,
  uiPlaying,
  isLooping,
  onLoopToggle,
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
          <span className="text-[10px] text-zinc-500 animate-pulse">Loading…</span>
        )}
        {uiReady && uiPlaying && (
          <span className="text-[10px] text-blue-400">▶</span>
        )}
      </div>

      {/* Extra controls */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 shrink-0">Notation:</span>

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
      </div>
    </>
  );
};
