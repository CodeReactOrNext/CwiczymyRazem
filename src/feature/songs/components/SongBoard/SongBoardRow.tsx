import { cn } from "assets/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song } from "feature/songs/types/songs.type";
import { Heart, Music, Play } from "lucide-react";

const formatPracticeTime = (ms: number) => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "<1m";
};

const StatCell = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold tracking-wider text-zinc-500">{label}</p>
    <p
      className={cn(
        "mt-0.5 truncate text-sm font-semibold tabular-nums",
        muted ? "text-zinc-600" : "text-zinc-200"
      )}
    >
      {value}
    </p>
  </div>
);

interface SongBoardRowProps {
  song: Song;
  progress: UserSongProgress | null;
  onOpenDetails: () => void;
  onPractice: () => void;
  /** Favorites page: shows a heart toggle instead of relying on the card menu. */
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

/**
 * Board row: one song of the repertoire with its practice stats
 * (sessions, play time, last practice, best GP accuracy) and tier.
 */
export const SongBoardRow = ({
  song,
  progress,
  onOpenDetails,
  onPractice,
  isFavorite,
  onToggleFavorite,
}: SongBoardRowProps) => {
  const sessionCount = progress?.sessionCount ?? 0;
  const totalPracticeMs = progress?.totalPracticeMs ?? 0;
  const lastPracticedAt = progress?.lastPracticedAt ?? null;
  const bestAccuracy = progress?.bestAccuracy ?? null;
  const hasPracticed = sessionCount > 0 || totalPracticeMs > 0;

  const lastPracticeLabel = lastPracticedAt
    ? formatDistanceToNowStrict(lastPracticedAt, { addSuffix: true })
    : "—";

  return (
    <div
      onClick={onOpenDetails}
      className="group flex cursor-pointer items-center gap-3 rounded-lg bg-zinc-900/40 p-3 transition-background hover:bg-zinc-800/40 md:gap-4 md:px-4"
    >
      {/* Cover */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg md:h-14 md:w-14">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={`${song.title} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800">
            <Music className="h-5 w-5 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Title / artist (+ compact stats below lg) */}
      <div className="min-w-0 flex-1">
        <p translate="no" className="truncate text-[15px] font-bold text-white">
          {song.title}
        </p>
        <p translate="no" className="truncate text-sm text-zinc-400">
          {song.artist}
        </p>
        <p className="mt-1 truncate text-xs text-zinc-500 lg:hidden">
          {hasPracticed ? (
            <>
              {sessionCount} session{sessionCount === 1 ? "" : "s"} ·{" "}
              {formatPracticeTime(totalPracticeMs)}
              {lastPracticedAt && <> · {lastPracticeLabel}</>}
              {bestAccuracy !== null && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-amber-400">
                    {Math.round(bestAccuracy)}%
                  </span>
                </>
              )}
            </>
          ) : (
            "Not practiced yet"
          )}
        </p>
      </div>

      {/* Stats columns (lg+) */}
      <div className="hidden w-[300px] shrink-0 grid-cols-3 gap-4 lg:grid xl:w-[340px]">
        <StatCell
          label="Sessions"
          value={hasPracticed ? String(sessionCount) : "—"}
          muted={!hasPracticed}
        />
        <StatCell
          label="Play time"
          value={hasPracticed ? formatPracticeTime(totalPracticeMs) : "—"}
          muted={!hasPracticed}
        />
        <StatCell
          label="Last practice"
          value={lastPracticeLabel}
          muted={!lastPracticedAt}
        />
      </div>

      {/* Best GP accuracy (sm+) */}
      <div className="hidden w-16 shrink-0 flex-col items-end sm:flex">
        {bestAccuracy !== null ? (
          <>
            <span className="text-[10px] font-bold tracking-wider text-zinc-500">
              Best
            </span>
            <span className="text-xl font-black tabular-nums leading-tight text-amber-400">
              {Math.round(bestAccuracy)}%
            </span>
          </>
        ) : (
          <span aria-label="No GP accuracy yet" className="text-sm text-zinc-600">
            —
          </span>
        )}
      </div>

      <TierBadge song={song} className="h-9 w-9 shrink-0 text-sm" />

      {onToggleFavorite && (
        <button
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            "click-behavior flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isFavorite
              ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 hover:text-rose-300"
              : "bg-white/5 text-zinc-200 hover:bg-white/15 hover:text-white"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
      )}

      <button
        type="button"
        aria-label={`Practice ${song.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onPractice();
        }}
        className="click-behavior flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-200 transition-background hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Play className="h-4 w-4 fill-current" />
      </button>
    </div>
  );
};
