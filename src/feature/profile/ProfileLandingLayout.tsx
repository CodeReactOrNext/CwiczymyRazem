import { useIsFetching } from "@tanstack/react-query";
import { cn } from "assets/lib/utils";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { PAGE_CONTENT, PageShell } from "components/PageShell/PageShell";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getEquippedRarity } from "feature/arsenal/data/equippedGuitar";
import {
  guitarDefinitionByImageId,
  GUITARS_BY_ID,
} from "feature/arsenal/data/guitarDefinitions";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useEquippedGuitar } from "feature/arsenal/hooks/useUserArsenal";
import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";
import {
  getRankBadgeSrc,
  isGuitarImageId,
} from "feature/arsenal/utils/guitarImage";
import { DashboardWidgets } from "feature/dashboard/components/DashboardWidgets";
import type { DashboardDataContextValue } from "feature/dashboard/context/DashboardContext";
import {
  DashboardCustomizeProvider,
  DashboardDataProvider,
} from "feature/dashboard/context/DashboardContext";
import { DuelEloBadge } from "feature/duels/components/DuelEloBadge";
import { CUSTOM_IMAGE_PREFIX } from "feature/guitarBuilder/utils/customGuitar";
import { HeroLevelStat } from "feature/profile/components/HeroLevelStat";
import { HomeHero } from "feature/profile/components/HomeHero";
import { SongTierBadge } from "feature/profile/components/SongTierBadge";
import { getTrendData } from "feature/profile/utils/getTrendData";
import { useUserSongs } from "feature/songs/hooks/useUserSongs";
import { useTranslation } from "hooks/useTranslation";
import { useLastKnown } from "lib/querySnapshot/useLastKnown";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import type { StatisticsDataInterface } from "types/api.types";
import type { ProfileInterface } from "types/ProfileInterface";
import { convertMsToHM } from "utils/converter";

/**
 * How far the stage's wash goes into the rarity colour. The hue already says
 * which tier the guitar is; this makes a rarer one light the stage more. Kept
 * low on purpose — a large accent area much past this reads as a neon sign.
 */
const RARITY_LIGHT: Record<GuitarRarity, number> = {
  Common: 0.1,
  Uncommon: 0.14,
  Rare: 0.18,
  Epic: 0.21,
  Legendary: 0.24,
  Mythic: 0.27,
  "Custom Shop": 0.3,
};

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
  const { t: tDashboard } = useTranslation("dashboard");
  const arsenalLabels = useArsenalLabels();
  const router = useRouter();
  const { datasWithReports, year, setYear, isLoading, reportList } =
    useActivityLog(userAuth);
  const {
    songs,
    isLoading: isSongsLoading,
    isError: isSongsError,
  } = useUserSongs(userAuth);
  const { item: equippedGuitar } = useEquippedGuitar(userAuth);
  // Customize mode lives here, not in the cards: from md up its key sits in
  // the hero's strip.
  const [isEditing, setIsEditing] = useState(false);
  const customize = useMemo(() => ({ isEditing, setIsEditing }), [isEditing]);
  // Cards keep showing what they had while fresher answers are on the way;
  // the spinner by the Customize key is the only sign of that.
  const isRefreshing = useIsFetching() > 0;

  // The tier is worked out from the learned songs, and those load late (and
  // cannot go into the boot snapshot — they hold Firestore timestamps). The
  // difficulties from the last visit are enough to draw the same badge at
  // once; the real list replaces them when it lands.
  const freshLearned = useMemo(
    () => songs?.learned.map((song) => ({ avgDifficulty: song.avgDifficulty })),
    [songs],
  );
  const learnedForTier = useLastKnown("song-tier", userAuth, freshLearned);

  const todayStr = new Date().toDateString();
  const lastReportDate = userStats?.lastReportDate
    ? new Date(userStats.lastReportDate).toDateString()
    : null;
  const todayReport = datasWithReports.find(
    (d) => d.date.toDateString() === todayStr && d.report,
  )?.report;
  const isTodayCompleted = lastReportDate === todayStr || !!todayReport;
  // Nothing logged, ever: the hero asks for the first session instead of
  // today's, and leaves out the numbers that have nothing to show yet.
  const hasNeverPracticed =
    (userStats?.sessionCount ?? 0) === 0 &&
    !userStats?.lastReportDate &&
    !isTodayCompleted;

  // One fact under the title, and only after the session: what today came to.
  // The streak sits in the top bar already, so the hero does not repeat it.
  const todayMs = todayReport?.timeSumary.sumTime ?? 0;
  const fact =
    !hasNeverPracticed && isTodayCompleted && todayMs > 0
      ? { text: t("week_widget.practiced", { time: convertMsToHM(todayMs) }) }
      : null;

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
  // Named by what the guitar is now: the workshop can promote it past its mint
  // rarity, and that promotion only exists on the owner's inventory item.
  const equippedRarity = getEquippedRarity(equippedGuitar, specialGuitarDef);
  // A Builder guitar's picture only knows "Custom guitar"; the name its owner
  // gave it is on the inventory item. It has no brand to put in front either.
  const equippedDef = equippedGuitar
    ? GUITARS_BY_ID.get(equippedGuitar.guitarId)
    : undefined;
  const namedDef =
    equippedDef && equippedDef.imageId === specialGuitarDef?.imageId
      ? equippedDef
      : specialGuitarDef;
  const isCustomBuild =
    typeof imgPath === "string" && imgPath.startsWith(CUSTOM_IMAGE_PREFIX);
  const guitarName = namedDef
    ? isCustomBuild
      ? namedDef.name
      : `${namedDef.brand} ${namedDef.name}`
    : null;

  const lvl = userStats?.lvl ?? 1;
  const points = userStats?.points ?? 0;

  // ELO, song tier and level are drawn twice — CSS picks one, so nothing
  // flashes on load. On a phone they share one anatomy (label, 56px figure,
  // value) in equal columns under the Practice key, whether or not the player
  // has a duel rating yet. From md up they lie in the strip, and the level
  // takes the room the other two leave.
  const renderStats = (inline: boolean) => (
    <>
      <DuelEloBadge uid={userAuth} inline={inline} />
      <SongTierBadge
        learnedSongs={learnedForTier}
        isLoading={isSongsLoading && !learnedForTier}
        isError={isSongsError && !learnedForTier}
        isOwnProfile
        inline={inline}
        onClick={() => router.push("/songs?view=board")}
      />
      <HeroLevelStat
        lvl={lvl}
        points={points}
        variant={inline ? "bar" : "ring"}
      />
    </>
  );
  // Before the first session only the level is there: a rating and a tier
  // with nothing behind them would only say what is missing.
  const levelBar = <HeroLevelStat lvl={lvl} points={points} variant='bar' />;

  return (
    <PageShell>
      <HomeHero
        title={
          hasNeverPracticed
            ? t("landing.first_session")
            : isTodayCompleted
              ? t("landing.great_job")
              : t("landing.start_today")
        }
        fact={fact}
        cta={{
          label: hasNeverPracticed
            ? t("landing.start")
            : isTodayCompleted
              ? t("landing.practice_more")
              : t("landing.practice"),
          isPrimary: !isTodayCompleted,
          onClick: () => router.push("/timer"),
        }}
        guitar={
          isSpecialGuitar
            ? {
                src: getRankBadgeSrc(imgPath, "large"),
                caption:
                  guitarName && equippedRarity
                    ? {
                        name: guitarName,
                        rarity: arsenalLabels.rarity(equippedRarity),
                      }
                    : undefined,
                light: equippedRarity
                  ? {
                      color: getRarityColor(equippedRarity),
                      strength: RARITY_LIGHT[equippedRarity],
                    }
                  : undefined,
              }
            : null
        }
        // With no guitar on the stage Kostek has it: waving at a newcomer,
        // pointing at the Practice key before today's session, pleased after.
        mascot={
          hasNeverPracticed
            ? { mood: "wave" }
            : isTodayCompleted
              ? { mood: "celebrate" }
              : { mood: "nudge", lookAt: "left" }
        }
        stackedStats={
          hasNeverPracticed ? (
            levelBar
          ) : (
            <div className='grid auto-cols-fr grid-flow-col items-start gap-2'>
              {renderStats(false)}
            </div>
          )
        }
        stripStats={hasNeverPracticed ? levelBar : renderStats(true)}
        customize={{
          label: tDashboard("customize.customize"),
          refreshingLabel: tDashboard("customize.refreshing", "Updating…"),
          isEditing,
          isRefreshing,
          onClick: () => setIsEditing(true),
        }}
      />

      <div className={cn("relative z-10", PAGE_CONTENT)}>
        <DashboardDataProvider value={dashboardData}>
          <DashboardCustomizeProvider value={customize}>
            <DashboardWidgets />
          </DashboardCustomizeProvider>
        </DashboardDataProvider>
      </div>
    </PageShell>
  );
};

export default ProfileLandingLayout;
