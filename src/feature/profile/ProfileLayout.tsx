import { Card } from "assets/components/ui/card";
import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { PAGE_CONTENT, PageShell } from "components/PageShell/PageShell";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { useProfileLayout } from "feature/profile/hooks/useProfileLayout";
import { useSongPracticeTimes } from "feature/profile/hooks/useSongPracticeTimes";
import type { ProfileSectionId } from "feature/profile/types/profileLayout.types";
import {
  resolveFeaturedSongs,
  resolveTrophies,
} from "feature/profile/utils/profileLayout";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { SkillTreeCards } from "feature/skills/SkillTreeCards";
import { useUserSongs } from "feature/songs/hooks/useUserSongs";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { ProfileInterface } from "types/ProfileInterface";
import { getReconciledStreak, hasRestDays } from "utils/gameLogic";

import { PracticeInsights } from "./components/PracticeInsights/PracticeInsights";
import { ProfileArsenal } from "./components/ProfileArsenal";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileSections } from "./components/ProfileSections";
import {
  AboutSection,
  LearningSection,
} from "./components/ProfileTextSections";
import { SongCase } from "./components/SongCase";
import { SongSkillShowcase } from "./components/SongSkillShowcase";
import { StatsSection } from "./components/StatsSection";
import { TrophyCase } from "./components/TrophyCase";
import { UserRecordingsSection } from "./components/UserRecordingsSection";

interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userData: ProfileInterface;
  userAuth: string;
}

const ProfileLayout = ({
  statsField,
  userData,
  userAuth,
}: LandingLayoutProps) => {
  const { statistics } = userData;
  const { lastReportDate, achievements } = statistics;
  const [userSkills, setUserSkills] = useState<UserSkills>();
  const { reportList, datasWithReports, year, setYear, isLoading } =
    useActivityLog(userAuth);

  const currentUserId = useAppSelector(selectUserAuth);
  const isOwner = !!currentUserId && currentUserId === userAuth;
  const { layout, updateLayout } = useProfileLayout(
    userAuth,
    userData.profileLayout,
    isOwner,
  );

  // Streak: same logic as the header — the activity log (local time) is the
  // timezone-correct source of truth, with the stored counter as a fallback
  // until the log loads. See getReconciledStreak.
  const { dayWithoutBreak: streak } = getReconciledStreak({
    actualDayWithoutBreak: statistics.actualDayWithoutBreak || 0,
    lastReportDate,
    restDays: hasRestDays(statistics),
    reportDates: (reportList ?? []).map(
      (report: { date: Date | string }) => report.date,
    ),
  });

  const {
    songs,
    isLoading: isSongsLoading,
    isError: isSongsError,
  } = useUserSongs(userAuth);
  const practiceTimes = useSongPracticeTimes(userAuth);

  useEffect(() => {
    getUserSkills(userAuth).then((skills) => setUserSkills(skills));
  }, [userAuth]);

  const trophies = resolveTrophies(layout, achievements ?? []);
  const featuredSongs = resolveFeaturedSongs(layout, songs?.learned ?? []);
  // The two cases stand side by side when the player keeps them next to each
  // other and both have something in them; alone, a case takes the whole row.
  const trophiesAt = layout.sections.findIndex((s) => s.id === "trophies");
  const songsAt = layout.sections.findIndex((s) => s.id === "signature-songs");
  const casesPaired =
    trophiesAt !== -1 &&
    songsAt !== -1 &&
    Math.abs(trophiesAt - songsAt) === 1 &&
    trophies.length > 0 &&
    featuredSongs.length > 0;

  const renderSection = (id: ProfileSectionId) => {
    switch (id) {
      case "trophies": {
        const owned = new Set(achievements ?? []);
        return (
          <TrophyCase
            trophies={trophies}
            isPinned={layout.trophies.some((t) => owned.has(t))}
            isOwner={isOwner}
            wide={!casesPaired}
          />
        );
      }
      case "signature-songs": {
        const learnedIds = new Set(
          (songs?.learned ?? []).map((song) => song.id),
        );
        return (
          <SongCase
            songs={featuredSongs}
            isPinned={layout.featuredSongs.some((songId) =>
              learnedIds.has(songId),
            )}
            isOwner={isOwner}
            practiceTimes={practiceTimes}
            wide={!casesPaired}
          />
        );
      }
      case "about":
        return <AboutSection text={layout.about} />;
      case "insights":
        return (
          <div>
            <PracticeInsights statistics={statistics} />
          </div>
        );
      case "activity":
        return (
          <ActivityLogView
            year={year}
            setYear={setYear}
            datasWithReports={datasWithReports}
            isLoading={isLoading}
          />
        );
      case "statistics":
        return (
          // The stat tiles are the cards here — no frame around them.
          <div>
            <SectionHeader size='lg' title='Statistics' className='mb-6' />
            <StatsSection
              statsField={statsField}
              statistics={statistics}
              datasWithReports={datasWithReports}
              userSongs={songs}
              userAuth={userAuth}
              achievements={achievements}
              year={year}
              setYear={setYear}
              isLoadingActivity={isLoading}
            />
          </div>
        );
      case "repertoire":
        return (
          <SongSkillShowcase
            userSongs={songs}
            profileUserId={userAuth}
            practiceTimes={practiceTimes}
          />
        );
      case "learning":
        return (
          <LearningSection
            songs={songs?.learning}
            practiceTimes={practiceTimes}
          />
        );
      case "skills":
        return userSkills &&
          Object.keys(userSkills.unlockedSkills ?? {}).length > 0 ? (
          <Card className='p-5 sm:p-6'>
            <SectionHeader title='Skills' className='mb-6' />
            <SkillTreeCards isUserProfile userSkills={userSkills} />
          </Card>
        ) : null;
      case "rig":
        return <ProfileArsenal userAuth={userAuth} />;
      case "recordings":
        return <UserRecordingsSection userId={userAuth} />;
      case "seasonal":
        return <SeasonalAchievements userId={userAuth} hideWhenEmpty />;
    }
  };

  return (
    <PageShell className='overflow-hidden md:overflow-visible'>
      <ProfileHeader
        userData={userData}
        userAuth={userAuth}
        layout={layout}
        streak={streak}
        learnedSongs={songs?.learned}
        isSongsLoading={isSongsLoading}
        isSongsError={isSongsError}
      />

      <div className={PAGE_CONTENT}>
        <ProfileSections
          layout={layout}
          updateLayout={updateLayout}
          isOwner={isOwner}
          renderSection={renderSection}
          sizeOverrides={
            casesPaired
              ? { trophies: "half", "signature-songs": "half" }
              : undefined
          }
          earned={achievements ?? []}
          learnedSongs={songs?.learned ?? []}
        />
      </div>
    </PageShell>
  );
};

export default ProfileLayout;
