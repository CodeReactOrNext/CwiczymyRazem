import { useQuery } from "@tanstack/react-query";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar/Avatar";
import type { ScoredRun } from "feature/exercisePlan/types/exercise.types";
import type { RankNeighbor } from "feature/leadboard/services/getExerciseRankNeighbors";
import { getExerciseRankNeighbors } from "feature/leadboard/services/getExerciseRankNeighbors";
import { selectUserAuth, selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useAppSelector } from "store/hooks";

// The score that actually stands on the board: a run below the player's own
// record leaves that record — and therefore that place — untouched.
const boardScoreOf = (run: ScoredRun) => Math.max(run.score, run.previousBest);

/** Gold / silver / bronze for the podium, cyan for the player — same language as
 *  the exercise leaderboard dialog. */
const rankBadgeClass = (rank: number, isPlayer: boolean) => {
  if (isPlayer) return "bg-cyan-500 text-zinc-950";
  if (rank === 1) return "bg-amber-400/15 text-amber-300";
  if (rank === 2) return "bg-zinc-300/15 text-zinc-200";
  if (rank === 3) return "bg-orange-600/15 text-orange-400";
  return "bg-zinc-800/60 text-zinc-400";
};

interface StandingRowProps {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  /** Tempo the standing score was played at; absent where it isn't known. */
  bpm?: number;
  isPlayer?: boolean;
  /** Shown on the player's row when the run came in under their standing record. */
  runScore?: number;
}

function StandingRow({ rank, name, avatar, score, bpm, isPlayer = false, runScore }: StandingRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg px-4 py-3',
        isPlayer ? 'bg-cyan-500/10' : 'bg-zinc-800/30'
      )}>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
          rankBadgeClass(rank, isPlayer)
        )}>
        {rank}
      </span>

      <Avatar avatarURL={avatar} name={name || 'Player'} size='sm' />

      <div className='min-w-0 flex-1'>
        <p translate='no' className={cn('truncate text-sm font-semibold', isPlayer ? 'text-cyan-300' : 'text-zinc-300')}>
          {isPlayer ? 'You' : name}
        </p>
        {runScore !== undefined && (
          <p className='text-[11px] tabular-nums text-zinc-500'>this run {runScore.toLocaleString()}</p>
        )}
      </div>

      <div className='shrink-0 text-right'>
        <span className={cn('block text-base font-bold tabular-nums', isPlayer ? 'text-cyan-400' : 'text-zinc-200')}>
          {score.toLocaleString()}
        </span>
        {bpm !== undefined && <span className='text-[11px] font-semibold tabular-nums text-zinc-500'>{bpm} BPM</span>}
      </div>
    </div>
  );
}

function DeltaChip({ run }: { run: ScoredRun }) {
  const delta = run.score - run.previousBest;

  if (run.previousBest === 0) {
    return <span className='shrink-0 rounded bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-400'>First score</span>;
  }
  if (delta > 0) {
    return (
      <span className='shrink-0 rounded bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-emerald-400'>
        +{delta.toLocaleString()} vs your best
      </span>
    );
  }
  if (delta === 0) {
    return <span className='shrink-0 rounded bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-400'>Matched your best</span>;
  }
  return (
    <span className='shrink-0 rounded bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-zinc-400'>
      {delta.toLocaleString()} vs your best
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
      <div className='mb-4 flex items-center justify-between gap-4'>
        <p className='min-w-0 truncate text-sm font-semibold text-zinc-200'>{run.exerciseTitle}</p>
        <DeltaChip run={run} />
      </div>

      <div className='space-y-2'>
        {above.map((entry) => (
          <StandingRow key={entry.userId} rank={entry.rank} name={entry.displayName} avatar={entry.avatar} score={entry.score} bpm={entry.bpm} />
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
          <StandingRow key={entry.userId} rank={entry.rank} name={entry.displayName} avatar={entry.avatar} score={entry.score} bpm={entry.bpm} />
        ))}
      </div>
    </div>
  );
}

function StandingSkeleton() {
  return (
    <div className='animate-pulse'>
      <div className='mb-4 h-3.5 w-48 rounded bg-zinc-800/60' />
      <div className='space-y-2'>
        {[0, 1, 2].map((row) => (
          <div key={row} className='h-14 rounded-lg bg-zinc-800/30' />
        ))}
      </div>
    </div>
  );
}

interface SessionLeaderboardCardProps {
  runs: ScoredRun[];
}

/**
 * Where the session's scored exercises left the player on each exercise
 * leaderboard, with the players standing directly above and below.
 */
export const SessionLeaderboardCard = ({ runs }: SessionLeaderboardCardProps) => {
  const userAuth = useAppSelector(selectUserAuth);
  const playerName = useAppSelector(selectUserName) || 'You';
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
      className='rounded-lg bg-zinc-900/40 p-7 md:p-8'>
      <div className='mb-6 flex items-center gap-2'>
        <Trophy className='h-4 w-4 text-amber-500' aria-hidden />
        <h3 className='text-sm font-semibold text-zinc-300'>Where you stand</h3>
      </div>

      <div className='space-y-10'>
        {isLoading
          ? runs.map((run) => <StandingSkeleton key={run.exerciseId} />)
          : standings.map(({ run, neighbors }) => (
              <ExerciseStanding
                key={run.exerciseId}
                run={run}
                rank={neighbors.rank}
                above={neighbors.above}
                below={neighbors.below}
                playerName={playerName}
                playerAvatar={playerAvatar}
              />
            ))}
      </div>
    </motion.div>
  );
};
