import { useQuery } from "@tanstack/react-query";
import { cn } from "assets/lib/utils";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { formatPracticed } from "feature/user/view/ReportView/helpers/sessionSongs";
import { motion } from "framer-motion";
import { ExternalLink, Music } from "lucide-react";
import { memo } from "react";
import { useAppSelector } from "store/hooks";

import type { Exercise } from "../../../types/exercise.types";

interface SongPracticePanelProps {
  song: NonNullable<Exercise["songData"]>;
  /** Tighter spacing for the mobile content column. */
  compact?: boolean;
}

/**
 * The player slot for a song placed in a routine (see songToExercise) when the
 * player has no Guitar Pro file attached to it — with one attached, the tab
 * renders here instead, like on the song's own practice page.
 *
 * There is nothing to detect or follow, so it says what the slot is for: play
 * the song however you rehearse it, the session clock is crediting the song.
 */
export const SongPracticePanel = memo(function SongPracticePanel({
  song,
  compact = false,
}: SongPracticePanelProps) {
  const userId = useAppSelector(selectUserAuth);

  // Same key as the songs board and the session log's picker, so the number
  // shown here is the one the player saw on the song a moment ago.
  const { data: progressList } = useQuery({
    queryKey: ["user-song-progress", userId],
    queryFn: () => getAllUserSongProgress(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
  const practicedMs =
    progressList?.find((progress) => progress.songId === song.songId)?.totalPracticeMs ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.03] to-transparent",
        compact ? "p-4" : "p-6 md:p-8"
      )}>
      <div className='pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl' />

      <div
        className={cn(
          "relative flex items-center gap-4",
          compact ? "flex-row" : "flex-col text-center sm:flex-row sm:gap-6 sm:text-left"
        )}>
        {song.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverUrl}
            alt=''
            className={cn(
              "shrink-0 rounded-lg object-cover",
              compact ? "h-16 w-16" : "h-24 w-24 sm:h-28 sm:w-28"
            )}
          />
        ) : (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-500",
              compact ? "h-16 w-16" : "h-24 w-24 sm:h-28 sm:w-28"
            )}>
            <Music className={compact ? "h-6 w-6" : "h-9 w-9"} />
          </div>
        )}

        <div className='min-w-0 flex-1'>
          <span className='inline-flex items-center gap-1.5 rounded bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-300'>
            <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />
            Song
          </span>

          <h3
            translate='no'
            className={cn(
              "mt-2 truncate font-bold tracking-tight text-white",
              compact ? "text-base" : "text-lg sm:text-xl"
            )}>
            {song.title}
          </h3>
          <p translate='no' className='truncate text-sm text-zinc-400'>
            {song.artist}
            {practicedMs > 0 && (
              <span className='text-zinc-500'> · {formatPracticed(practicedMs)} with this song</span>
            )}
          </p>

          {!compact && (
            <p className='mt-3 text-sm leading-relaxed text-zinc-400'>
              Play it the way you rehearse it — from memory, along the record, or
              with your own tab. The session clock is counting this time towards
              the song.
            </p>
          )}

          <a
            href={`/songs?view=board&songId=${encodeURIComponent(song.songId)}`}
            target='_blank'
            rel='noreferrer'
            className='mt-3 inline-flex items-center gap-1.5 rounded bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/40'>
            <ExternalLink className='h-3.5 w-3.5 text-zinc-400' />
            Open song
          </a>
        </div>
      </div>
    </motion.div>
  );
});
