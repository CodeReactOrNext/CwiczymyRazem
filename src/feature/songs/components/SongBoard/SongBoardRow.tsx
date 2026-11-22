import { PRESSABLE } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { SongPartMarks } from "feature/songs/components/SongPartMarks/SongPartMarks";
import {
  SONG_ARTIST_CLASS,
  SONG_TITLE_CLASS,
  SongThumb,
} from "feature/songs/components/SongRow/SongRow";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song, SongPart } from "feature/songs/types/songs.type";
import {
  ARRANGEMENT_META,
  formatPlayTime,
  getPracticedArrangements,
} from "feature/songs/utils/arrangements.utils";
import { songCoverLayoutId } from "feature/songs/utils/songCoverLayout";
import { useTranslation } from "hooks/useTranslation";
import { useDateFnsLocale } from "lib/i18n/dateLocale";
import { useSharedElement } from "lib/motion/useSharedElement";
import { Heart, ListMusic, Play } from "lucide-react";

const StatCell = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className='min-w-0'>
    <p className='text-xs font-medium text-zinc-400'>
      {label}
    </p>
    <p
      className={cn(
        "mt-0.5 truncate text-sm font-semibold tabular-nums",
        muted ? "text-zinc-600" : "text-zinc-200",
      )}>
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
  onPartsChange?: (parts: SongPart[]) => void;
  /** A community-verified YouTube section map exists for this song. */
  hasSectionMap?: boolean;
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
  onPartsChange,
  hasSectionMap,
}: SongBoardRowProps) => {
  const { t } = useTranslation("songs");
  const dateLocale = useDateFnsLocale();
  const sessionCount = progress?.sessionCount ?? 0;
  const totalPracticeMs = progress?.totalPracticeMs ?? 0;
  const lastPracticedAt = progress?.lastPracticedAt ?? null;
  const bestAccuracy = progress?.bestAccuracy ?? null;
  const hasPracticed = sessionCount > 0 || totalPracticeMs > 0;
  const practicedArrangements = getPracticedArrangements(progress?.arrangements);
  const { layoutDependency, runAfterSnapshot } = useSharedElement();

  const lastPracticeLabel = lastPracticedAt
    ? formatDistanceToNowStrict(lastPracticedAt, {
        addSuffix: true,
        locale: dateLocale,
      })
    : "—";

  return (
    <div
      onClick={() => runAfterSnapshot(onOpenDetails)}
      className='group flex cursor-pointer items-center gap-3 rounded-lg bg-zinc-800/40 p-3 transition-background hover:bg-zinc-800/60 md:gap-4 md:px-4'>
      {/* Cover — morphs into the detail view's cover (see songCoverLayout) */}
      <SongThumb
        coverUrl={song.coverUrl}
        alt={`${song.title} cover`}
        layoutId={songCoverLayoutId(song.id)}
        layoutDependency={layoutDependency}
      />

      {/* Title / artist (+ compact stats below lg) */}
      <div className='min-w-0 flex-1'>
        <p translate='no' className={SONG_TITLE_CLASS}>
          {song.title}
        </p>
        <p translate='no' className={SONG_ARTIST_CLASS}>
          {song.artist}
        </p>
        {/* The map badge leads this line instead of sharing the title row, so it
            stays fully visible while long titles keep the whole width to truncate in. */}
        <div className='mt-1 flex min-w-0 items-center gap-2'>
          {hasSectionMap && (
            <Chip
              color='gray'
              size='sm'
              title={t("board.map_available")}
              className='shrink-0'>
              <ListMusic className='h-3 w-3' />
              {t("board.map")}
            </Chip>
          )}
          {practicedArrangements.map(({ arrangement, progress: slice }) => (
            <Chip
              key={arrangement}
              color='gray'
              size='sm'
              title={`${t(`arrangements.${arrangement}.label`, ARRANGEMENT_META[arrangement].label)}: ${formatPlayTime(slice.totalPracticeMs)}`}
              className='shrink-0 gap-1.5 tabular-nums'>
              <span
                aria-hidden
                className={cn("h-1.5 w-1.5 rounded-full", ARRANGEMENT_META[arrangement].dot)}
              />
              <span className='hidden sm:inline'>
                {t(`arrangements.${arrangement}.label`, ARRANGEMENT_META[arrangement].label)}
              </span>
              <span className='sm:hidden'>{ARRANGEMENT_META[arrangement].short}</span>
              <span className='text-zinc-400'>{formatPlayTime(slice.totalPracticeMs)}</span>
            </Chip>
          ))}
          <p className='min-w-0 truncate text-xs text-zinc-500 2xl:hidden'>
            {hasPracticed ? (
              <>
                {sessionCount === 1
                  ? t("arrangements.session_one")
                  : t("arrangements.sessions", { count: sessionCount })}{" "}
                ·{" "}
                {formatPlayTime(totalPracticeMs)}
                {lastPracticedAt && <> · {lastPracticeLabel}</>}
                {bestAccuracy !== null && (
                  <>
                    {" "}
                    ·{" "}
                    <span className='font-semibold text-amber-400'>
                      {Math.round(bestAccuracy)}%
                    </span>
                  </>
                )}
              </>
            ) : (
              t("board.not_practiced")
            )}
          </p>
        </div>
        {/* Part marks below lg — the row is too tight for a separate column */}
        {onPartsChange && (
          <div
            className='mt-1.5 lg:hidden'
            onClick={(e) => e.stopPropagation()}>
            <SongPartMarks
              parts={progress?.parts ?? []}
              onChange={onPartsChange}
            />
          </div>
        )}
      </div>

      {/* Part marks column (lg+) */}
      {onPartsChange && (
        <div
          className='hidden shrink-0 lg:block'
          onClick={(e) => e.stopPropagation()}>
          <SongPartMarks
            parts={progress?.parts ?? []}
            onChange={onPartsChange}
          />
        </div>
      )}

      {/* Stats columns (2xl+) — below that the compact line under the title
          carries them, so the title keeps its width at common laptop sizes. */}
      <div className='hidden w-[340px] shrink-0 grid-cols-3 gap-4 2xl:grid'>
        <StatCell
          label={t("board.sessions")}
          value={hasPracticed ? String(sessionCount) : "—"}
          muted={!hasPracticed}
        />
        <StatCell
          label={t("board.play_time")}
          value={hasPracticed ? formatPlayTime(totalPracticeMs) : "—"}
          muted={!hasPracticed}
        />
        <StatCell
          label={t("board.last_practice")}
          value={lastPracticeLabel}
          muted={!lastPracticedAt}
        />
      </div>

      {/* Best GP accuracy (sm+) */}
      <div className='hidden w-16 shrink-0 flex-col items-end sm:flex'>
        {bestAccuracy !== null ? (
          <>
            <span className='text-xs font-medium text-zinc-400'>
              {t("board.best")}
            </span>
            <span className='text-xl font-black tabular-nums leading-tight text-amber-400'>
              {Math.round(bestAccuracy)}%
            </span>
          </>
        ) : (
          <span
            aria-label={t("board.no_accuracy")}
            className='text-sm text-zinc-600'>
            —
          </span>
        )}
      </div>

      <TierBadge song={song} className='h-9 w-9 shrink-0 text-sm' />

      {onToggleFavorite && (
        <button
          type='button'
          aria-label={isFavorite ? t("board.remove_favorite") : t("board.add_favorite")}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(PRESSABLE, "border-b-black/30", 
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isFavorite
              ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 hover:text-rose-300"
              : "bg-white/10 text-zinc-200 hover:bg-white/15 hover:text-white",
          )}>
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
      )}

      <button
        type='button'
        aria-label={t("board.practice_song", { title: song.title })}
        onClick={(e) => {
          e.stopPropagation();
          onPractice();
        }}
        className={cn(PRESSABLE, "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-zinc-200 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/15 hover:text-white border-b-black/30")}>
        <Play className='h-4 w-4 fill-current' />
      </button>
    </div>
  );
};
