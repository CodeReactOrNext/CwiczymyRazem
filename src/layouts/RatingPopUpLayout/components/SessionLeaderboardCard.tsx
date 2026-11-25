import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import type { ScoredRun } from "feature/exercisePlan/types/exercise.types";
import { RankRow } from "feature/leadboard/components/RankRow";
import type { RankNeighbor } from "feature/leadboard/services/getExerciseRankNeighbors";
import { getExerciseRankNeighbors } from "feature/leadboard/services/getExerciseRankNeighbors";
import { selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Trophy } from "lucide-react";
import { useAppSelector } from "store/hooks";

// The score that actually stands on the board: a run below the player's own
// record leaves that record — and therefore that place — untouched.
const boardScoreOf = (run: ScoredRun) => Math.max(run.score, run.previousBest);

interface StandingRowProps {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  /** Links the row to the player's profile. */
  userId?: string;
  /** Tempo the standing score was played at; absent where it isn't known. */
  bpm?: number;
  isPlayer?: boolean;
  /** Shown on the player's row when the run came in under their standing record. */
  runScore?: number;
}

function StandingRow({ rank, name, avatar, score, userId, bpm, isPlayer = false, runScore }: StandingRowProps) {
  const { t } = useTranslation("session_summary");
  return (
    <RankRow
      place={rank}
      nick={isPlayer ? t('you') : name || t('player')}
      avatarUrl={avatar}
      profileId={userId}
      isCurrentUser={isPlayer}
      score={score.toLocaleString()}
      scoreLabel={bpm !== undefined ? `${bpm} BPM` : undefined}
      meta={
        runScore !== undefined ? (
          <span className='tabular-nums'>{t('this_run', { score: runScore.toLocaleString() })}</span>
        ) : undefined
      }
      density='compact'
      surface='bare'
    />
  );
}

function DeltaChip({ run }: { run: ScoredRun }) {
  const { t } = useTranslation("session_summary");
  const delta = run.score - run.previousBest;

  if (run.previousBest === 0) {
    return <span className='shrink-0 rounded bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-400'>{t('first_score')}</span>;
  }
  if (delta > 0) {
    return (
      <span className='shrink-0 rounded bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-emerald-400'>
        {t('vs_best', { delta: `+${delta.toLocaleString()}` })}
      </span>
    );
  }
  if (delta === 0) {
    return <span className='shrink-0 rounded bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-400'>{t('matched_best')}</span>;
  }
  return (
    <span className='shrink-0 rounded bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-zinc-400'>
      {t('vs_best', { delta: delta.toLocaleString() })}
    </span>
  );
}

interface ExerciseStandingProps {
  run: ScoredRun;
  rank: number;
  above: RankNeighbor[];
  below: RankNeighbor[];
  playerName: string;
  playerAvatar: string;
}

function ExerciseStanding({
  run, rank, above, below, playerName, playerAvatar,
}: ExerciseStandingProps) {
  const boardScore = boardScoreOf(run);

  return (
    <div>
      <div className='mb-4 flex items-center justify-between gap-4 shortwide:mb-2'>
        <p className='min-w-0 truncate text-sm font-semibold text-zinc-200'>{run.exerciseTitle}</p>
        <DeltaChip run={run} />
      </div>

      <ol className='flex flex-col gap-1'>
        {above.map((entry) => (
          <StandingRow key={entry.userId} rank={entry.rank} name={entry.displayName} avatar={entry.avatar} score={entry.score} userId={entry.userId} bpm={entry.bpm} />
        ))}

        <StandingRow
          rank={rank}
          name={playerName}
          avatar={playerAvatar}
          score={boardScore}
          // Only this run's tempo is known here. When an older record still holds
          // the place, that record's tempo isn't loaded — so show none.
          bpm={boardScore === run.score ? run.bpm : undefined}
          isPlayer
          runScore={boardScore > run.score ? run.score : undefined}
        />

        {below.map((entry) => (
          <StandingRow key={entry.userId} rank={entry.rank} name={entry.displayName} avatar={entry.avatar} score={entry.score} userId={entry.userId} bpm={entry.bpm} />
        ))}
      </ol>
    </div>
  );
}

function StandingSkeleton() {
  return (
    <div aria-busy='true'>
      <Skeleton className='mb-4 h-3.5 w-48' />
      <div className='space-y-2'>
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className='h-14 rounded-lg' />
        ))}
      </div>
    </div>
  );
}

/** Who to show around the player: one either side, or two where the other side is empty. */
const closest = (above: RankNeighbor[], below: RankNeighbor[]) => ({
  above: above.slice(below.length > 0 ? -1 : -2),
  below: below.slice(0, above.length > 0 ? 1 : 2),
});

interface SessionLeaderboardCardProps {
  runs: ScoredRun[];
  className?: string;
}

/**
 * Where the session's scored exercises left the player on each exercise
 * leaderboard, with the players standing directly above and below.
 */
export const SessionLeaderboardCard = ({ runs, className }: SessionLeaderboardCardProps) => {
  const { t } = useTranslation("session_summary");
  const userAuth = useAppSelector(selectUserAuth);
  const playerName = useAppSelector(selectUserName) || t('you');
  const playerAvatar = useAppSelector(selectUserAvatar) || '';

  const { data, isLoading } = useQuery({
    queryKey: ['sessionExerciseStandings', userAuth, runs.map((run) => `${run.exerciseId}:${boardScoreOf(run)}`).join('|')],
    queryFn: () =>
      Promise.all(
        runs.map(async (run) => ({
          run,
          neighbors: await getExerciseRankNeighbors(run.exerciseId, boardScoreOf(run), userAuth!),
        }))
      ),
    enabled: !!userAuth && runs.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const standings = (data ?? []).flatMap(({ run, neighbors }) => (neighbors ? [{ run, neighbors }] : []));

  // An unreadable leaderboard leaves nothing worth a card — say nothing instead.
  if (!isLoading && standings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn('rounded-lg bg-zinc-800/40 p-7 md:p-8 shortwide:p-4', className)}>
      <SectionHeader
        as='h3'
        title={
          <span className='flex items-center gap-2'>
            <Trophy className='h-4 w-4 text-amber-500' aria-hidden />
            {t('where_you_stand')}
          </span>
        }
        className='mb-6 shortwide:mb-3'
      />

      <div className='space-y-10'>
        {isLoading
          ? runs.map((run) => <StandingSkeleton key={run.exerciseId} />)
          : standings.map(({ run, neighbors }) => (
              <ExerciseStanding
                key={run.exerciseId}
                run={run}
                rank={neighbors.rank}
                {...closest(neighbors.above, neighbors.below)}
                playerName={playerName}
                playerAvatar={playerAvatar}
              />
            ))}
      </div>
    </motion.div>
  );
};
