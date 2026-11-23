import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import {
  PAGE_CONTENT,
  PAGE_GUTTER,
  PageShell,
} from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_HERO_CLASS, LIBRARY_TABS } from "constants/navTabs";
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

  // `?roadmap=` from a "roadmap ready" notification; `?roadmapId=` from the
  // map itself — the open step's URL and the way back from an exercise or song.
  const [linkedRoadmapId] = useState<string | null>(() => {
    const { roadmap, roadmapId } = router.query;
    if (typeof roadmap === "string") return roadmap;
    return typeof roadmapId === "string" ? roadmapId : null;
  });
  const [detailOpen, setDetailOpen] = useState(() => linkedRoadmapId !== null);

  const handleDetail = (open: boolean) => {
    setDetailOpen(open);
    // Drop the deep link on the way back, or a refresh reopens the roadmap.
    if (
      !open &&
      (router.query.roadmap || router.query.roadmapId || router.query.step)
    ) {
      const {
        roadmap: _roadmap,
        roadmapId: _roadmapId,
        step: _step,
        ...query
      } = router.query;
      void router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    }
  };

  return (
    <PageShell>
      {!detailOpen && (
        <>
          <HeroBanner
            title={t("panel.players.page.title")}
            subtitle={t("panel.players.page.subtitle")}
            eyebrow={t("panel.players.page.eyebrow")}
            eyebrowClassName='text-cyan-400/80'
            className={LIBRARY_HERO_CLASS}
            backgroundContent={<HeroPattern variant='ai' />}
            rightContent={
              isSupporter && board ? (
                <TokenWalletBar wallet={board.wallet} />
              ) : undefined
            }
          />

          <div className={cn(PAGE_GUTTER, "pt-6")}>
            <PageTabs
              tabs={LIBRARY_TABS}
              activeHref='/my-roadmaps'
              ariaLabel={t("library:sections")}
            />
          </div>
        </>
      )}

      <div className={cn(!detailOpen && PAGE_CONTENT)}>
        {isRosterLoading ? (
          // The roster answers "not a supporter" until it lands.
          <Skeleton variant='block' className='h-72' />
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
    </PageShell>
  );
};
