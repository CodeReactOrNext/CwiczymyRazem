import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import type { Translate } from "lib/i18n/translate";
import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { SubmitRecordingDialog } from "feature/challenges/components/SubmitRecordingDialog";
import {
  useChallengeSubmissions,
  useCurrentChallenge,
} from "feature/challenges/hooks/useChallenges";
import type { ChallengeSong } from "feature/challenges/types/challenge.types";
import { isChallengeLive } from "feature/challenges/utils/challengeMonth";
import { getClearedSongIds } from "feature/challenges/utils/challengeProgress";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { SongPracticePickerLauncher } from "feature/songs/components/SongPracticePickerModal/SongPracticePickerLauncher";
import { selectUserName } from "feature/user/store/userSlice";
import type { Timestamp } from "firebase/firestore";
import { Check, Medal, Music, Play, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import { WidgetHeader, WidgetLink } from "./WidgetHeader";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysLeftLabel = (
  endsAt: Timestamp | undefined,
  t: Translate,
): string | null => {
  if (!endsAt || typeof endsAt.toDate !== "function") return null;
  const days = Math.ceil((endsAt.toDate().getTime() - Date.now()) / DAY_MS);
  if (!Number.isFinite(days) || days <= 0) return t("challenge.ends_today");
  return days === 1
    ? t("challenge.one_day_left")
    : t("challenge.days_left", { count: days });
};

/**
 * The month's board in five rows: which songs are up, which ones already have
 * a recording from this player, and how long is left to add the rest. A row
 * opens the song's practice picker; the plus next to it sends the recording,
 * so the board can be played through without leaving Home.
 */
export const MonthlyChallengeWidget = () => {
  const { t } = useTranslation("dashboard");
  const { userAuth } = useDashboardData();
  const userName = useAppSelector(selectUserName) ?? t("challenge.player");
  const { data: challenge, isLoading } = useCurrentChallenge();
  const { data: submissions = [] } = useChallengeSubmissions(challenge?.id);
  const [practiceSongId, setPracticeSongId] = useState<string | null>(null);
  const [submitSong, setSubmitSong] = useState<ChallengeSong | null>(null);

  const recorded = useMemo(
    () => getClearedSongIds(submissions, userAuth),
    [submissions, userAuth],
  );

  const songs = challenge?.songs ?? [];
  const daysLeft = daysLeftLabel(challenge?.endsAt, t);

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        icon={Medal}
        title={t("challenge.title")}
        action={<WidgetLink href='/challenges'>{t("challenge.open")}</WidgetLink>}
      />

      {isLoading ? (
        <div className='space-y-2'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-10 w-full rounded-lg' />
          ))}
        </div>
      ) : !challenge ? (
        <p className='text-sm text-zinc-400'>
          {t("challenge.none")}
        </p>
      ) : (
        <div className='flex flex-1 flex-col gap-4'>
          <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
            <p className='text-sm font-semibold text-zinc-100'>
              {challenge.title}
            </p>
            {daysLeft && (
              <span className='text-xs text-zinc-400'>{daysLeft}</span>
            )}
          </div>

          <ul className='space-y-0.5'>
            {songs.map((song) => {
              const done = recorded.has(song.songId);
              return (
                <li key={song.songId} className='flex items-center gap-2'>
                  {/* The negative margin keeps covers on the card's text edge
                      while the hover background still gets room around them. */}
                  <button
                    type='button'
                    onClick={() => setPracticeSongId(song.songId)}
                    aria-label={t("challenge.practice_song", {
                      title: song.title,
                      artist: song.artist,
                    })}
                    className='group -ml-2 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:bg-zinc-800/50'>
                    <span className='relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-800'>
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt=''
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Music size={14} className='text-zinc-500' />
                      )}
                      <span className='absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                        <Play size={14} className='fill-current' />
                      </span>
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span
                        translate='no'
                        className='block truncate text-sm text-zinc-100'>
                        {song.title}
                      </span>
                      <span
                        translate='no'
                        className='block truncate text-xs text-zinc-400'>
                        {song.artist}
                      </span>
                    </span>
                  </button>

                  {/* One slot, two states: the plus turns into the check once
                      the recording is in. */}
                  {done ? (
                    <span className='flex h-8 w-8 shrink-0 items-center justify-center'>
                      <Check
                        size={16}
                        className='text-emerald-400'
                        aria-label={t("challenge.recorded")}
                      />
                    </span>
                  ) : (
                    <button
                      type='button'
                      onClick={() => setSubmitSong(song)}
                      aria-label={t("challenge.submit_song", { title: song.title })}
                      title={t("challenge.submit")}
                      className='flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:bg-zinc-800 hover:text-zinc-100'>
                      <Plus size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <p className='mt-auto text-xs text-zinc-400'>
            <Interpolate
              text={t("challenge.recorded_count")}
              values={{
                count: (
                  <span className='font-semibold text-zinc-300'>
                    {t("challenge.x_of_y", {
                      done: recorded.size,
                      total: songs.length,
                    })}
                  </span>
                ),
              }}
            />
          </p>

          <SubmitRecordingDialog
            challenge={challenge}
            song={submitSong}
            userId={userAuth}
            userName={userName}
            isFinalSong={recorded.size === songs.length - 1}
            paysReward={isChallengeLive(challenge.id)}
            onClose={() => setSubmitSong(null)}
          />
        </div>
      )}

      <SongPracticePickerLauncher
        songId={practiceSongId}
        userId={userAuth}
        onClose={() => setPracticeSongId(null)}
      />
    </Card>
  );
};
