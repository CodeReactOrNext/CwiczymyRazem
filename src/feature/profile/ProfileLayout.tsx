import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
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
import { getReconciledStreak } from "utils/gameLogic";

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

  const renderSection = (id: ProfileSectionId) => {
    switch (id) {
      case "trophies": {
        const owned = new Set(achievements ?? []);
        return (
          <TrophyCase
            trophies={resolveTrophies(layout, achievements ?? [])}
            isPinned={layout.trophies.some((t) => owned.has(t))}
            isOwner={isOwner}
          />
        );
      }
      case "signature-songs": {
        const learned = songs?.learned ?? [];
        const learnedIds = new Set(learned.map((song) => song.id));
        return (
          <SongCase
            songs={resolveFeaturedSongs(layout, learned)}
            isPinned={layout.featuredSongs.some((songId) =>
              learnedIds.has(songId),
            )}
            isOwner={isOwner}
            practiceTimes={practiceTimes}
          />
        );
      }
      case "about":
        return <AboutSection text={layout.about} />;
      case "insights":
        return (
          <div className='font-openSans'>
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
          <div className='rounded-2xl bg-zinc-900/30 p-6 backdrop-blur-sm'>
            <h2 className='mb-6 text-2xl font-bold text-white'>Statistics</h2>
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
          <div className='rounded-lg bg-zinc-900/30 p-4 sm:p-6'>
            <h2 className='mb-6 text-2xl font-bold text-white'>Skills</h2>
            <SkillTreeCards isUserProfile userSkills={userSkills} />
          </div>
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
    <div className='flex flex-col overflow-hidden rounded-xl border-none bg-second-600 shadow-sm md:overflow-visible'>
      <ProfileHeader
        userData={userData}
        userAuth={userAuth}
        layout={layout}
        streak={streak}
        learnedSongs={songs?.learned}
        isSongsLoading={isSongsLoading}
        isSongsError={isSongsError}
      />

      <div className='p-4 md:p-6'>
        <ProfileSections
          layout={layout}
          updateLayout={updateLayout}
          isOwner={isOwner}
          renderSection={renderSection}
          earned={achievements ?? []}
          learnedSongs={songs?.learned ?? []}
        />
      </div>
    </div>
  );
};

export default ProfileLayout;
