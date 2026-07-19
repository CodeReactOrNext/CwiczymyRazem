function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

interface ScoreControlsProps {
  currentMs: number;
  totalMs: number;
  uiReady: boolean;
  uiPlaying: boolean;
}

/**
 * Progress bar.
 * Play/pause/BPM/speed/metronome are intentionally absent — those live in the session UI.
 * Looping is always on (see useAlphaTabApi's playerReady handler) — no toggle needed.
 */
export const ScoreControls = ({
  currentMs,
  totalMs,
  uiReady,
  uiPlaying,
}: ScoreControlsProps) => {
  const progress = totalMs > 0 ? (currentMs / totalMs) * 100 : 0;

  return (
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
  );
};
