import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ChallengeBoard } from "feature/challenges/components/ChallengeBoard";
import { PastChallenges } from "feature/challenges/components/PastChallenges";
import { VotingBoard } from "feature/challenges/components/VotingBoard";
import {
  useChallengeSubmissions,
  useCurrentChallenge,
  useNominations,
  usePastChallenges,
} from "feature/challenges/hooks/useChallenges";
import type { Challenge } from "feature/challenges/types/challenge.types";
import { selectUserAuth, selectUserName } from "feature/user/store/userSlice";
import { ArrowLeft, History, Swords, Vote } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

type ChallengeTab = "board" | "vote" | "archive";

const TABS: { id: ChallengeTab; label: string; icon: typeof Swords }[] = [
  { id: "board", label: "This month", icon: Swords },
  { id: "vote", label: "Vote", icon: Vote },
  { id: "archive", label: "Archive", icon: History },
];

const BoardSkeleton = () => (
  <div className='space-y-6 p-4 sm:p-6 md:p-10'>
    <div className='flex flex-col gap-6 md:flex-row md:items-end'>
      <div className='h-40 w-40 shrink-0 animate-pulse rounded-md bg-zinc-900 md:h-48 md:w-48' />
      <div className='flex-1 space-y-3'>
        <div className='h-3 w-40 animate-pulse rounded bg-zinc-900' />
        <div className='h-10 w-64 animate-pulse rounded bg-zinc-900' />
        <div className='h-3 w-52 animate-pulse rounded bg-zinc-900' />
      </div>
    </div>
    <div className='max-w-4xl space-y-2'>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className='h-14 animate-pulse rounded-lg bg-zinc-900/60' />
      ))}
    </div>
  </div>
);

/**
 * Three faces of the same thing: the board you play this month, the ballot that
 * decides next month's, and everything already closed.
 */
export const ChallengesView = () => {
  const [tab, setTab] = useState<ChallengeTab>("board");
  const [archivedChallenge, setArchivedChallenge] = useState<Challenge | null>(
    null,
  );

  const userId = useAppSelector(selectUserAuth);
  const userName = useAppSelector(selectUserName) ?? "Player";

  const { data: currentChallenge, isLoading: isLoadingChallenge } =
    useCurrentChallenge();
  const { data: nominations = [] } = useNominations();
  const { data: pastChallenges = [] } = usePastChallenges();

  // The archive reuses the live board component, so it needs that month's runs.
  const openChallenge = archivedChallenge ?? currentChallenge ?? null;
  const { data: submissions = [] } = useChallengeSubmissions(openChallenge?.id);

  const showArchivedBoard = tab === "archive" && !!archivedChallenge;

  return (
    <div className='font-openSans min-h-screen'>
      <div className='flex flex-wrap items-center gap-2 p-4 sm:px-6 md:px-10'>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setArchivedChallenge(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors",
              tab === id
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
            )}>
            <Icon className='h-4 w-4' />
            {label}
          </button>
        ))}
      </div>

      {tab === "board" &&
        (isLoadingChallenge ? (
          <BoardSkeleton />
        ) : currentChallenge ? (
          <ChallengeBoard
            challenge={currentChallenge}
            submissions={submissions}
            currentUserId={userId ?? null}
            userName={userName}
          />
        ) : (
          <div className='flex flex-col items-center justify-center py-24 text-center'>
            <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500'>
              <Swords size={26} />
            </div>
            <h3 className='mb-1 text-lg font-bold text-white'>
              This month’s board isn’t up yet
            </h3>
            <p className='max-w-sm text-sm text-zinc-500'>
              It gets drawn from the community ballot. Head to Vote and put a
              song forward.
            </p>
            <Button
              onClick={() => setTab("vote")}
              variant='ghost'
              className='mt-6 h-10 bg-white/5 px-5 font-bold text-zinc-300 hover:bg-white/10 hover:text-white'>
              <span className='flex items-center gap-2'>
                <Vote className='h-4 w-4' />
                Open the ballot
              </span>
            </Button>
          </div>
        ))}

      {tab === "vote" && (
        <VotingBoard
          nominations={nominations}
          currentUserId={userId ?? null}
          userName={userName}
        />
      )}

      {tab === "archive" &&
        (showArchivedBoard ? (
          <div className='space-y-2'>
            <div className='px-4 pt-2 sm:px-6 md:px-10'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setArchivedChallenge(null)}
                className='bg-white/5 px-4 text-zinc-400 backdrop-blur-md hover:text-white'>
                <span className='flex items-center gap-2'>
                  <ArrowLeft size={16} />
                  <span className='text-xs font-bold'>Back to archive</span>
                </span>
              </Button>
            </div>
            <ChallengeBoard
              challenge={archivedChallenge}
              submissions={submissions}
              currentUserId={userId ?? null}
              userName={userName}
            />
          </div>
        ) : (
          <PastChallenges
            challenges={pastChallenges}
            onOpen={setArchivedChallenge}
          />
        ))}
    </div>
  );
};
