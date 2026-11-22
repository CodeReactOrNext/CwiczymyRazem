import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { EmptyState } from "components/EmptyState/EmptyState";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { tabNavItemClass, tabNavListClass } from "components/PageTabs/tabNav";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { ChallengeBoard } from "feature/challenges/components/ChallengeBoard";
import { ChallengeHero } from "feature/challenges/components/ChallengeHero";
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
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { History, Swords, Vote } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

type ChallengeTab = "board" | "vote" | "archive";

const TABS: { id: ChallengeTab; label: string; icon: typeof Swords }[] = [
  { id: "board", label: "This month", icon: Swords },
  { id: "vote", label: "Vote", icon: Vote },
  { id: "archive", label: "Archive", icon: History },
];

const BoardSkeleton = () => (
  <div className='space-y-2' aria-busy='true'>
    {Array.from({ length: 5 }, (_, i) => (
      <Skeleton key={i} variant='block' className='h-14' />
    ))}
  </div>
);

/**
 * Three faces of the same thing: the board you play this month, the ballot that
 * decides next month's, and everything already closed.
 */
export const ChallengesView = () => {
  const { t } = useTranslation("challenges");
  const intlLocale = useIntlLocale();
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
    <div className='flex flex-col'>
      {heroChallenge ? (
        <ChallengeHero
          challenge={heroChallenge}
          submissions={submissions}
          currentUserId={userId ?? null}
        />
      ) : (
        <HeroBanner
          eyebrow={tab === "vote" ? t("view.ballot_eyebrow") : t("view.monthly")}
          title={
            tab === "vote"
              ? t("view.vote_title")
              : tab === "archive"
                ? t("view.archive_title")
                : t("view.monthly")
          }
          subtitle={
            tab === "vote"
              ? t("view.vote_subtitle", {
                  count: CHALLENGE_SONG_COUNT,
                  month: challengeMonthLabel(votingChallengeId(), intlLocale),
                })
              : tab === "archive"
                ? t("view.archive_subtitle")
                : t("view.board_subtitle")
          }
          backgroundContent={<HeroPattern />}
        />
      )}

      {/* Horizontal padding matches the banner's, so the tabs and the board line
          up with the title above them. */}
      <div className={cn("flex flex-col gap-6", PAGE_CONTENT)}>
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
              {t(`view.tabs.${id}`, label)}
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
              <EmptyState
                mood='wait'
                title={t("view.not_up_title")}
                description={t("view.not_up_body")}
                action={
                  <Button onClick={() => setTab("vote")}>
                    <Vote />
                    {t("view.open_ballot")}
                  </Button>
                }
              />
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
                <BackLink
                  label={t("view.back_to_archive")}
                  onClick={() => setArchivedChallenge(null)}
                />
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
