import { Button } from "assets/components/ui/button";
import { tabNavItemClass, tabNavListClass } from "components/PageTabs/tabNav";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { ChallengeBoard } from "feature/challenges/components/ChallengeBoard";
import {
  CHALLENGE_HERO_CLASS,
  ChallengeHero,
} from "feature/challenges/components/ChallengeHero";
import { PastChallenges } from "feature/challenges/components/PastChallenges";
import { VotingBoard } from "feature/challenges/components/VotingBoard";
import {
  useChallengeSubmissions,
  useCurrentChallenge,
  useNominations,
  usePastChallenges,
} from "feature/challenges/hooks/useChallenges";
import type { Challenge } from "feature/challenges/types/challenge.types";
import { CHALLENGE_SONG_COUNT } from "feature/challenges/types/challenge.types";
import {
  challengeMonthLabel,
  votingChallengeId,
} from "feature/challenges/utils/challengeMonth";
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
  <div className='space-y-2'>
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className='h-14 animate-pulse rounded-lg bg-zinc-900/60' />
    ))}
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

  /** A board on screen — live or archived — carries the month's own banner. */
  const heroChallenge = showArchivedBoard
    ? archivedChallenge
    : tab === "board"
      ? (currentChallenge ?? null)
      : null;

  return (
    <div className='font-openSans flex min-h-screen flex-col'>
      {heroChallenge ? (
        <ChallengeHero
          challenge={heroChallenge}
          submissions={submissions}
          currentUserId={userId ?? null}
        />
      ) : (
        <HeroBanner
          eyebrow={tab === "vote" ? "Community ballot" : "Monthly challenge"}
          title={
            tab === "vote"
              ? "Pick next month’s board"
              : tab === "archive"
                ? "Challenge archive"
                : "Monthly challenge"
          }
          subtitle={
            tab === "vote"
              ? `The top ${CHALLENGE_SONG_COUNT} of the ${challengeMonthLabel(
                  votingChallengeId(),
                )} ballot become the next board.`
              : tab === "archive"
                ? "Every board that has closed — still browsable, still playable."
                : "Five community-voted songs every month. Record them all to clear it."
          }
          backgroundContent={<HeroPattern />}
          className={CHALLENGE_HERO_CLASS}
        />
      )}

      {/* Horizontal padding matches the banner's, so the tabs and the board line
          up with the title above them. */}
      <div className='flex flex-col gap-6 px-6 pb-16 pt-6 md:px-8 lg:px-10'>
        <div className={tabNavListClass}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type='button'
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                setTab(id);
                setArchivedChallenge(null);
              }}
              className={tabNavItemClass(tab === id)}>
              <Icon size={16} className='shrink-0' />
              {label}
            </button>
          ))}
        </div>

        <div>
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
                  It gets drawn from the community ballot. Head to Vote and put
                  a song forward.
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
              <div className='space-y-4'>
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
      </div>
    </div>
  );
};
