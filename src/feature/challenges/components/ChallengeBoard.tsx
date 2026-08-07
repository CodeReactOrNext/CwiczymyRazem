import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ChallengeCover } from "feature/challenges/components/ChallengeCover";
import { PlayerStack } from "feature/challenges/components/PlayerStack";
import {
  FameIcon,
  PointsIcon,
} from "feature/challenges/components/RewardIcons";
import { SubmissionsDialog } from "feature/challenges/components/SubmissionsDialog";
import { SubmitRecordingDialog } from "feature/challenges/components/SubmitRecordingDialog";
import type {
  Challenge,
  ChallengeSong,
  ChallengeSubmission,
} from "feature/challenges/types/challenge.types";
import {
  FAME_CLEAR_BONUS,
  FAME_PER_SUBMISSION,
  POINTS_PER_SUBMISSION,
} from "feature/challenges/types/challenge.types";
import {
  challengeMonthLabel,
  daysLeftInChallenge,
  isChallengeLive,
} from "feature/challenges/utils/challengeMonth";
import {
  countParticipants,
  getClearedSongIds,
  groupSubmissionsBySong,
} from "feature/challenges/utils/challengeProgress";
import { getSongTier } from "feature/songs/utils/getSongTier";
import {
  Check,
  Flag,
  Music,
  Swords,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

interface ChallengeBoardProps {
  challenge: Challenge;
  submissions: ChallengeSubmission[];
  currentUserId: string | null;
  userName: string;
}

interface ChallengeRowProps {
  song: ChallengeSong;
  index: number;
  isCleared: boolean;
  isPrevCleared: boolean;
  isNextUp: boolean;
  isLocked: boolean;
  songSubmissions: ChallengeSubmission[];
  onSubmit: () => void;
  onOpenRuns: () => void;
}

const ChallengeRow = ({
  song,
  index,
  isCleared,
  isPrevCleared,
  isNextUp,
  isLocked,
  songSubmissions,
  onSubmit,
  onOpenRuns,
}: ChallengeRowProps) => {
  const tier = getSongTier(
    (song.avgDifficulty ?? 0) === 0
      ? "?"
      : song.tier || song.avgDifficulty || "?",
  );
  const runCount = songSubmissions.length;

  return (
    <div className='group relative flex items-stretch'>
      {/* Road: dashed while untraveled, solid green once behind you */}
      <div className='relative w-10 shrink-0 sm:w-12'>
        {index > 0 && (
          <span
            className={cn(
              "absolute left-1/2 top-0 h-1/2 -translate-x-1/2",
              isPrevCleared
                ? "w-0.5 bg-green-500"
                : "w-0 border-l border-dashed border-white/20",
            )}
          />
        )}
        <span
          className={cn(
            "absolute bottom-0 left-1/2 top-1/2 -translate-x-1/2",
            isCleared
              ? "w-0.5 bg-green-500"
              : "w-0 border-l border-dashed border-white/20",
          )}
        />
        <span
          className={cn(
            "absolute left-1/2 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
            isCleared
              ? "bg-green-500 text-black"
              : isNextUp
                ? "bg-zinc-950 text-amber-300 ring-2 ring-amber-400"
                : "bg-zinc-800 text-zinc-400 ring-1 ring-white/10",
          )}>
          {isCleared ? (
            <Check className='h-3.5 w-3.5' strokeWidth={3} />
          ) : (
            index + 1
          )}
        </span>
      </div>

      <span
        className={cn(
          "hidden h-px w-3 shrink-0 self-center sm:block",
          isCleared ? "bg-green-500/50" : "bg-white/10",
        )}
      />

      {/* Station */}
      <div
        className={cn(
          "my-1 flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-3 rounded-lg bg-white/[0.02] px-2 py-2.5 transition-colors group-hover:bg-white/[0.06] sm:flex-nowrap sm:px-3",
          isCleared && "opacity-80 group-hover:opacity-100",
        )}>
        <div className='h-10 w-10 shrink-0 overflow-hidden rounded-[4px] bg-zinc-800'>
          {song.coverUrl ? (
            <img
              src={song.coverUrl}
              alt=''
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center text-zinc-600'>
              <Music className='h-4 w-4' />
            </div>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <p
            translate='no'
            className='truncate text-sm font-semibold text-white'>
            {song.title}
          </p>
          <p translate='no' className='truncate text-xs text-zinc-500'>
            {song.artist}
            {song.votes > 0 && (
              <span className='ml-2 text-zinc-600'>
                {song.votes} {song.votes === 1 ? "vote" : "votes"}
              </span>
            )}
          </p>
        </div>

        {/* Who already played it — the social proof for this slot */}
        <button
          type='button'
          onClick={onOpenRuns}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold transition-colors",
            runCount > 0
              ? "text-zinc-300 hover:bg-white/10 hover:text-white"
              : "text-zinc-600 hover:bg-white/5",
          )}>
          <PlayerStack submissions={songSubmissions} />
          {runCount > 0 ? (
            <span className='tabular-nums'>{runCount}</span>
          ) : (
            <>
              <Users className='h-3.5 w-3.5' />
              <span>0</span>
            </>
          )}
        </button>

        <span
          className='hidden shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold sm:inline'
          style={{ backgroundColor: `${tier.color}14`, color: tier.color }}>
          {tier.tier}
        </span>

        {isCleared ? (
          <span className='flex shrink-0 items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-400'>
            <Check className='h-3.5 w-3.5' strokeWidth={3} />
            done
          </span>
        ) : (
          <Button
            size='sm'
            variant='ghost'
            disabled={isLocked}
            onClick={onSubmit}
            className={cn(
              "h-8 shrink-0 px-3 text-xs font-bold",
              isLocked
                ? "text-zinc-600"
                : "bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white",
            )}>
            <span className='flex items-center gap-1.5'>
              <Upload className='h-3.5 w-3.5' />
              Submit
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};

export const ChallengeBoard = ({
  challenge,
  submissions,
  currentUserId,
  userName,
}: ChallengeBoardProps) => {
  const [submitSong, setSubmitSong] = useState<ChallengeSong | null>(null);
  const [runsSong, setRunsSong] = useState<ChallengeSong | null>(null);

  const isLive = isChallengeLive(challenge.id);
  const daysLeft = daysLeftInChallenge(challenge.id);

  const bySong = useMemo(
    () => groupSubmissionsBySong(submissions),
    [submissions],
  );
  const clearedSongIds = useMemo(
    () => getClearedSongIds(submissions, currentUserId),
    [submissions, currentUserId],
  );
  const participants = useMemo(
    () => countParticipants(submissions),
    [submissions],
  );

  const songs = challenge.songs;
  const clearedCount = songs.filter((s) => clearedSongIds.has(s.songId)).length;
  const nextUpIndex = songs.findIndex((s) => !clearedSongIds.has(s.songId));
  const hasClearedBoard = songs.length > 0 && clearedCount === songs.length;

  return (
    <div className='relative min-h-full'>
      {/* Hue wash behind the header — amber marks this as a competition */}
      <div
        className='pointer-events-none absolute inset-x-0 top-0 h-[360px]'
        style={{
          background:
            "linear-gradient(to bottom, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.07) 45%, transparent 100%)",
        }}
      />

      <div className='relative z-10 space-y-7 p-4 sm:p-6 md:p-10'>
        {/* Header */}
        <div className='flex flex-col gap-6 md:flex-row md:items-end'>
          <ChallengeCover
            songs={songs}
            className='h-40 w-40 shrink-0 rounded-md shadow-2xl md:h-48 md:w-48'
            iconSize={48}
          />

          <div className='min-w-0 flex-1 space-y-3'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold'>
              <span className='flex items-center gap-1.5 text-amber-300'>
                <Swords className='h-3.5 w-3.5' />
                Monthly challenge
              </span>
              <span className='hidden h-1 w-1 rounded-full bg-zinc-600 sm:block' />
              <span className='font-medium text-zinc-500'>
                {isLive
                  ? daysLeft === 0
                    ? "closes today"
                    : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
                  : "closed"}
              </span>
              <span className='hidden h-1 w-1 rounded-full bg-zinc-600 sm:block' />
              <span className='w-full font-medium text-zinc-500 sm:w-auto'>
                {isLive
                  ? `Voted in by the community — record all ${songs.length} to clear it`
                  : "Still playable — late runs don’t pay points or fame"}
              </span>
            </div>

            <h1
              translate='no'
              className='break-words text-3xl font-black tracking-tight text-white md:text-5xl'>
              {challengeMonthLabel(challenge.id)}
            </h1>

            <p className='flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-400'>
              <span className='flex items-center gap-1.5'>
                <Users className='h-3.5 w-3.5' />
                {participants} {participants === 1 ? "player" : "players"}
              </span>
              <span className='h-1 w-1 rounded-full bg-zinc-600' />
              <span>
                {submissions.length} {submissions.length === 1 ? "run" : "runs"}
              </span>
              {(challenge.finisherCount ?? 0) > 0 && (
                <>
                  <span className='h-1 w-1 rounded-full bg-zinc-600' />
                  <span className='flex items-center gap-1 text-amber-300'>
                    <Trophy className='h-3 w-3' />
                    {challenge.finisherCount} cleared it
                  </span>
                </>
              )}
            </p>

            {/* Reward ledger — what a run is worth, stated up front. A closed
                board pays nothing, so it says that instead of quoting rates. */}
            <div className='flex flex-wrap gap-2 pt-1'>
              {isLive ? (
                <>
                  <span className='inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-400'>
                    <PointsIcon />
                    <span className='font-bold text-white'>
                      +{POINTS_PER_SUBMISSION}
                    </span>
                    points per run
                  </span>
                  <span className='inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-400'>
                    <FameIcon />
                    <span className='font-bold text-amber-300'>
                      +{FAME_PER_SUBMISSION}
                    </span>
                    fame per run
                  </span>
                  <span className='inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200/80'>
                    <FameIcon />
                    <span className='font-bold text-amber-300'>
                      +{FAME_CLEAR_BONUS}
                    </span>
                    fame for the full board
                  </span>
                </>
              ) : (
                <span className='inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-400'>
                  <PointsIcon className='opacity-40 grayscale' />
                  <FameIcon className='opacity-40 grayscale' />
                  This month is closed — runs still land on the board, but pay{" "}
                  <span className='font-bold text-white'>
                    no points or fame
                  </span>
                </span>
              )}
            </div>

            {songs.length > 0 && currentUserId && (
              <div className='max-w-sm space-y-1.5 pt-1'>
                <div className='flex items-baseline justify-between text-xs font-semibold'>
                  <span className='text-zinc-400'>
                    {clearedCount} of {songs.length} recorded
                  </span>
                  <span className='tabular-nums text-zinc-500'>
                    {Math.round((clearedCount / songs.length) * 100)}%
                  </span>
                </div>
                <div className='h-1 overflow-hidden rounded-full bg-white/10'>
                  <div
                    className='h-full rounded-full bg-green-500 transition-all duration-700'
                    style={{ width: `${(clearedCount / songs.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Track list */}
        <div className='max-w-4xl'>
          {songs.map((song, index) => (
            <ChallengeRow
              key={song.songId}
              song={song}
              index={index}
              isCleared={clearedSongIds.has(song.songId)}
              isPrevCleared={
                index > 0 && clearedSongIds.has(songs[index - 1].songId)
              }
              isNextUp={index === nextUpIndex}
              isLocked={!currentUserId}
              songSubmissions={bySong.get(song.songId) ?? []}
              onSubmit={() => setSubmitSong(song)}
              onOpenRuns={() => setRunsSong(song)}
            />
          ))}

          {/* Finish flag — lights up once every song has your recording */}
          {songs.length > 0 && (
            <div className='flex items-stretch'>
              <div className='relative h-16 w-10 shrink-0 sm:w-12'>
                <span
                  className={cn(
                    "absolute left-1/2 top-0 h-1/2 -translate-x-1/2",
                    clearedSongIds.has(songs[songs.length - 1].songId)
                      ? "w-0.5 bg-green-500"
                      : "w-0 border-l border-dashed border-white/20",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors",
                    hasClearedBoard
                      ? "bg-amber-400 text-black shadow-[0_0_24px_rgba(251,191,36,0.35)]"
                      : "bg-zinc-900 text-zinc-500 ring-1 ring-white/10",
                  )}>
                  <Flag className='h-3.5 w-3.5' />
                </span>
              </div>
              <span className='hidden w-3 shrink-0 sm:block' />
              <div className='flex flex-col justify-center'>
                <p
                  className={cn(
                    "text-sm font-bold",
                    hasClearedBoard ? "text-amber-300" : "text-white",
                  )}>
                  {hasClearedBoard ? "Board cleared" : "Final stop"}
                </p>
                <p className='flex flex-wrap items-center gap-1 text-xs font-medium text-zinc-500'>
                  {hasClearedBoard ? (
                    isLive ? (
                      <>
                        Every song recorded — the
                        <FameIcon className='h-3.5 w-3.5' />
                        <span className='font-bold text-amber-300'>
                          +{FAME_CLEAR_BONUS}
                        </span>
                        fame bonus is yours.
                      </>
                    ) : (
                      "Every song recorded — a clean sweep of the archive."
                    )
                  ) : (
                    `${songs.length - clearedCount} more ${
                      songs.length - clearedCount === 1 ? "run" : "runs"
                    } to clear ${isLive ? "the month" : "this board"}`
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SubmitRecordingDialog
        challenge={challenge}
        song={submitSong}
        userId={currentUserId}
        userName={userName}
        isFinalSong={clearedCount === songs.length - 1}
        paysReward={isLive}
        onClose={() => setSubmitSong(null)}
      />

      <SubmissionsDialog
        song={runsSong}
        submissions={runsSong ? (bySong.get(runsSong.songId) ?? []) : []}
        currentUserId={currentUserId}
        onClose={() => setRunsSong(null)}
      />
    </div>
  );
};
