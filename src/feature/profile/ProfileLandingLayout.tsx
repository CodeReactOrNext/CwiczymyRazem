import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { Kostek } from "components/Mascot/Kostek";
import { HeroBanner } from "components/UI/HeroBanner";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getEquippedRarity } from "feature/arsenal/data/equippedGuitar";
import { guitarDefinitionByImageId } from "feature/arsenal/data/guitarDefinitions";
import { useEquippedGuitar } from "feature/arsenal/hooks/useUserArsenal";
import {
  getRankBadgeSrc,
  isGuitarImageId,
} from "feature/arsenal/utils/guitarImage";
import { DashboardWidgets } from "feature/dashboard/components/DashboardWidgets";
import type { DashboardDataContextValue } from "feature/dashboard/context/DashboardContext";
import { DashboardDataProvider } from "feature/dashboard/context/DashboardContext";
import { DuelEloBadge } from "feature/duels/components/DuelEloBadge";
import { HeroLevelStat } from "feature/profile/components/HeroLevelStat";
import { SongTierBadge } from "feature/profile/components/SongTierBadge";
import { getTrendData } from "feature/profile/utils/getTrendData";
import { useUserSongs } from "feature/songs/hooks/useUserSongs";
import { useTranslation } from "hooks/useTranslation";
import { useLastKnown } from "lib/querySnapshot/useLastKnown";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo } from "react";
import type { StatisticsDataInterface } from "types/api.types";
import type { ProfileInterface } from "types/ProfileInterface";
import { convertMsToHM } from "utils/converter";

interface LandingLayoutProps {
  userStats: StatisticsDataInterface;
  /** The community feed, pinned to the bottom of Home; the default one is used when absent. */
  featSlot?: React.ReactNode;
  userAuth: string;
  userInfo?: Partial<ProfileInterface> | any | null;
}

const ProfileLandingLayout = ({
  userStats,
  userAuth,
  featSlot,
  userInfo,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
  const router = useRouter();
  const { datasWithReports, year, setYear, isLoading, reportList } =
    useActivityLog(userAuth);
  const {
    songs,
    isLoading: isSongsLoading,
    isError: isSongsError,
  } = useUserSongs(userAuth);
  const { item: equippedGuitar } = useEquippedGuitar(userAuth);

  // The tier is worked out from the learned songs, and those load late (and
  // cannot go into the boot snapshot — they hold Firestore timestamps). The
  // difficulties from the last visit are enough to draw the same badge at
  // once; the real list replaces them when it lands.
  const freshLearned = useMemo(
    () =>
      songs?.learned.map((song) => ({ avgDifficulty: song.avgDifficulty })),
    [songs],
  );
  const learnedForTier = useLastKnown("song-tier", userAuth, freshLearned);

  const todayStr = new Date().toDateString();
  const lastReportDate = userStats?.lastReportDate
    ? new Date(userStats.lastReportDate).toDateString()
    : null;
  const isTodayCompleted =
    lastReportDate === todayStr ||
    datasWithReports.some(
      (d) => d.date.toDateString() === todayStr && d.report,
    );

  const totalTimeValue = userStats
    ? convertMsToHM(
        userStats.time.technique +
          userStats.time.theory +
          userStats.time.creativity +
          userStats.time.hearing,
      )
    : "0 min";
  const timeTrendData = getTrendData(datasWithReports, "time");

  // Everything the cards under the hero read from — handed down once so the
  // heatmap and the streak share one load of the activity log.
  const dashboardData = useMemo<DashboardDataContextValue>(
    () => ({
      userAuth,
      userStats,
      activity: { year, setYear, datasWithReports, isLoading, reportList },
      totalTimeValue,
      timeTrendData,
      feedSlot: featSlot,
    }),
    [
      userAuth,
      userStats,
      year,
      setYear,
      datasWithReports,
      isLoading,
      reportList,
      totalTimeValue,
      timeTrendData,
      featSlot,
    ],
  );

  const imgPath = userInfo?.selectedGuitar;
  const isSpecialGuitar = isGuitarImageId(imgPath);
  const specialGuitarDef = isSpecialGuitar
    ? guitarDefinitionByImageId(imgPath)
    : null;
  // Lit by what the guitar is now: the workshop can promote it past its mint
  // rarity, and that promotion only exists on the owner's inventory item.
  const equippedRarity = getEquippedRarity(equippedGuitar, specialGuitarDef);
  // No special guitar equipped falls back to the brand cyan, not to a rarity.
  const glowColor = equippedRarity ? getRarityColor(equippedRarity) : "#0891b2";

  // ELO, song tier and level share one anatomy — label, 56px figure, value —
  // so they stand on one line. Rendered twice: in a row of their own under
  // Practice on phones and in the right column from md up (CSS picks one, so
  // nothing flashes on load). Equal columns on a phone, whether or not the
  // player has a duel rating yet.
  const renderProgress = () => (
    <div className='grid auto-cols-fr grid-flow-col items-start gap-2 md:flex md:gap-8'>
      <DuelEloBadge uid={userAuth} />
      <SongTierBadge
        learnedSongs={learnedForTier}
        isLoading={isSongsLoading && !learnedForTier}
        isError={isSongsError && !learnedForTier}
        isOwnProfile
        onClick={() => router.push("/songs?view=board")}
      />
      <HeroLevelStat
        lvl={userStats?.lvl ?? 1}
        points={userStats?.points ?? 0}
      />
    </div>
  );

  return (
    <div className='flex flex-col rounded-lg border-none bg-second-600'>
      <HeroBanner
        title={
          isTodayCompleted ? t("landing.great_job") : t("landing.start_today")
        }
        // The tall banner is there to frame a special guitar; without one it
        // would only push the dashboard down, so it shrinks to its content.
        compact={!isSpecialGuitar}
        leftContentClassName={isSpecialGuitar ? undefined : "mt-0"}
        className={cn(
          "w-full !flex-row !items-center !justify-between !rounded-none !shadow-none",
          // Still the tall banner — the guitar is the emotional part of Home —
          // only a notch shorter, so it pushes the cards down less.
          isSpecialGuitar && "min-h-[160px] md:min-h-[185px] lg:min-h-[205px]",
        )}
        backgroundContent={
          isSpecialGuitar ? (
            <div className='absolute inset-0 z-0 overflow-hidden rounded-none md:rounded-xl'>
              {/* Glow Blur on the left */}
              <div
                className='light-hide pointer-events-none absolute left-[0%] top-[-10%] opacity-25 blur-[80px] md:left-[5%] md:top-[-15%] md:opacity-30'
                style={{
                  backgroundColor: glowColor,
                  width: "350px",
                  height: "350px",
                  borderRadius: "50%",
                }}
              />

              {/* Guitar with CSS fade on the right side. On a phone it lies
                    across the banner at the same angle as on desktop, body
                    bottom-left and neck rising behind the progress. Stood
                    upright (-90°) it needed the old tall banner; in the short
                    one only the neck was left inside. */}
              <img
                src={getRankBadgeSrc(imgPath, "large")}
                className='light-flat pointer-events-none absolute left-[-8%] top-[-12%] h-[250px] max-w-none -rotate-[15deg] opacity-[0.75] md:left-[8%] md:top-[-35%] md:h-[410px]'
                style={{
                  filter: `drop-shadow(0 15px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 20px ${glowColor}30)`,
                  WebkitMaskImage:
                    "linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
                  maskImage:
                    "linear-gradient(to right, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
                }}
                alt=''
                aria-hidden
              />

              {/* The title and the button sit on the guitar's body; a pale
                  guitar under a white title needs a little dark behind it. */}
              <div
                aria-hidden
                className='light-hide pointer-events-none absolute inset-y-0 left-0 w-56 bg-gradient-to-r from-zinc-950/60 to-transparent md:w-80'
              />
            </div>
          ) : null
        }
        // Phones get the progress in leftContent, under the Practice button;
        // as the banner's own column it stacked below everything and doubled
        // the banner's height.
        rightContentClassName='hidden md:flex'
        rightContent={
          <div className='relative select-none'>{renderProgress()}</div>
        }
        leftContent={
          <div className='flex flex-col gap-5'>
            <div className='flex items-center gap-4 md:gap-5'>
              {/* White until today's session is in; after it the button steps
                  back, because the day's one job is done. */}
              <Button
                variant={isTodayCompleted ? "secondary" : "default"}
                onClick={() => router.push("/timer")}
                className='group/btn h-14 flex-1 px-8 text-base font-semibold md:flex-none'>
                {isTodayCompleted
                  ? t("landing.practice_more")
                  : t("landing.practice")}
                <ArrowRight className='h-5 w-5 transition-transform duration-base group-hover/btn:translate-x-1' />
              </Button>
              {/* With no special guitar to fill the banner, Kostek stands by
                  the button: pointing at it before today's session, pleased
                  after. A guitar is the banner's character on its own. */}
              {!isSpecialGuitar && (
                <Kostek
                  mood={isTodayCompleted ? "celebrate" : "nudge"}
                  lookAt={isTodayCompleted ? undefined : "left"}
                  className='-my-2 h-16 shrink-0 md:-my-4 md:h-24'
                />
              )}
            </div>
            {/* Always a row of its own on a phone. Beside the button it fitted
                or wrapped depending on whether the player had a duel rating.
                No backdrop: the banner is the one level of card. */}
            <div className='select-none md:hidden'>{renderProgress()}</div>
          </div>
        }
      />

      <div className='relative z-10 p-4 md:mt-6 md:p-6'>
        <DashboardDataProvider value={dashboardData}>
          <DashboardWidgets />
        </DashboardDataProvider>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
