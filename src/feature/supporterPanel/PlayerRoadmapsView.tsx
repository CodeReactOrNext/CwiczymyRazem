import { cn } from "assets/lib/utils";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_TABS } from "constants/navTabs";
import { PlayerRoadmapsLocked } from "feature/aiCoach/view/PlayerRoadmapsLocked";
import { TokenWalletBar } from "feature/supporterPanel/components/TokenWalletBar";
import { UserRoadmapsTab } from "feature/supporterPanel/components/UserRoadmapsTab";
import { useSupporterRoadmap } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

/**
 * Player Roadmaps as a page of its own under My Stuff: the roadmaps the coach
 * built for the player, the ones they started, and the rest of the board.
 *
 * An open roadmap takes the whole page, banner edge to edge, the same way a
 * curated one does on /ai-coach — so the page's own banner and tabs step
 * aside while it is open. A "roadmap ready" notification (?roadmap=) opens
 * straight onto it.
 */
export const PlayerRoadmapsView = () => {
  const { t } = useTranslation(["supporter", "library"]);
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);
  const { isSupport, isLoading: isRosterLoading } = useSupportTeam();
  const isSupporter = isSupport(userAuth);
  // Only for the wallet in the banner and on the generator card — the route
  // 403s without the badge.
  const { data: board } = useSupporterRoadmap(isSupporter);

  const [linkedRoadmapId] = useState<string | null>(() =>
    typeof router.query.roadmap === "string" ? router.query.roadmap : null,
  );
  const [detailOpen, setDetailOpen] = useState(() => linkedRoadmapId !== null);

  const handleDetail = (open: boolean) => {
    setDetailOpen(open);
    // Drop the deep link on the way back, or a refresh reopens the roadmap.
    if (!open && router.query.roadmap) {
      const { roadmap: _dropped, ...query } = router.query;
      void router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    }
  };

  return (
    <div className='flex min-h-screen flex-col overflow-visible rounded-lg bg-second-600'>
      {!detailOpen && (
        <>
          <HeroBanner
            title={t("panel.players.page.title")}
            subtitle={t("panel.players.page.subtitle")}
            eyebrow={t("panel.players.page.eyebrow")}
            eyebrowClassName='text-cyan-400/80'
            backgroundContent={<HeroPattern variant='ai' />}
            className='mb-6 min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
            rightContent={
              isSupporter && board ? (
                <TokenWalletBar wallet={board.wallet} />
              ) : undefined
            }
          />

          <div className='px-3 md:px-6 lg:px-8'>
            <PageTabs
              tabs={LIBRARY_TABS}
              activeHref='/my-roadmaps'
              ariaLabel={t("library:sections")}
            />
          </div>
        </>
      )}

      <div className={cn(!detailOpen && "px-3 py-6 md:px-6 md:py-8 lg:px-8")}>
        {isRosterLoading ? (
          // The roster answers "not a supporter" until it lands.
          <div className='h-72 animate-pulse rounded-lg bg-zinc-900/40' />
        ) : isSupporter ? (
          <UserRoadmapsTab
            enabled={isSupporter}
            wallet={board?.wallet}
            variant='page'
            onDetailChange={handleDetail}
            initialRoadmapId={linkedRoadmapId}
          />
        ) : (
          <PlayerRoadmapsLocked />
        )}
      </div>
    </div>
  );
};
