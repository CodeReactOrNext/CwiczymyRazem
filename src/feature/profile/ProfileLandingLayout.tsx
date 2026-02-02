import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DashboardContainer, DashboardSection } from "components/Layout";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { NavigationCards } from "feature/profile/components/NavigationCards/NavigationCards";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { StatisticsDataInterface } from "types/api.types";

import { StatsSection } from "./components/StatsSection";

interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userStats: StatisticsDataInterface;
  featSlot: React.ReactNode;
  userAuth: string;
}

import { useQuery } from "@tanstack/react-query";
import { ActiveChallengeWidget } from "feature/challenges/frontend/infrastructure/ui/ActiveChallengeWidget";
import { BarChart3, ChevronRight, Play, Bell } from "lucide-react";
import { GiMetronome } from "react-icons/gi";
import { useFCM } from "hooks/useFCM";

const ProfileLandingLayout = ({
  statsField,
  userStats,
  userAuth,
  featSlot,
}: LandingLayoutProps) => {
  const { notificationPermission } = useFCM();

  const router = useRouter();
  const { datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth);
  const { achievements } = userStats;
  const [_userSkills, setUserSkills] = useState<UserSkills>();
  const [activeTab, setActiveTab] = useState<"practice" | "review">("practice");

  const todayStr = new Date().toDateString();
  const isTodayCompleted = datasWithReports.some(d => d.date.toDateString() === todayStr && d.report);

  /* eslint-disable unused-imports/no-unused-vars */
  const { data: songs, refetch: refreshSongs } = useQuery({
    queryKey: ['userSongs', userAuth],
    queryFn: () => getUserSongs(userAuth),
    enabled: !!userAuth,
  });
  /* eslint-enable unused-imports/no-unused-vars */

  useEffect(() => {
    getUserSongs(userAuth);
    getUserSkills(userAuth).then((skills) => setUserSkills(skills));
  }, [userAuth]);

  return (
    <DashboardContainer>
      <div className="flex items-center gap-1 mb-8 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
        <button 
          onClick={() => setActiveTab("practice")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-wide transition-all duration-300 flex items-center gap-2 ${activeTab === 'practice' ? 'bg-white text-zinc-950 shadow-xl scale-100 ring-1 ring-white/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
        >
          <Play size={14} className={activeTab === 'practice' ? "fill-current" : ""} strokeWidth={3} />
          Practicing
        </button>
        <button 
          onClick={() => setActiveTab("review")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-wide transition-all duration-300 flex items-center gap-2 ${activeTab === 'review' ? 'bg-white text-zinc-950 shadow-xl scale-100 ring-1 ring-white/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
        >
          <BarChart3 size={14} strokeWidth={3} />
          See your stats
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={() => {
            if (typeof window !== 'undefined' && 'Notification' in window && notificationPermission !== 'granted') {
              Notification.requestPermission();
            }
          }}
          title={notificationPermission === 'granted' ? "Notifications enabled" : "Enable notifications"}
          className={`p-2.5 rounded-xl transition-all duration-300 ${notificationPermission === 'granted' ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
        >
          <Bell size={16} className={notificationPermission === 'granted' ? "fill-current" : ""} />
        </button>
      </div>

      {activeTab === "practice" && (
        <div className="space-y-8 py-4">
          <div className="space-y-12">
            {!isTodayCompleted && (
              <div 
                onClick={() => router.push("/timer")}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/5 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99]"
              >
                  <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="mb-3 flex items-center gap-1.5 rounded-full bg-zinc-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white w-fit">
                        Not practiced today
                      </div>
                      <h3 className="text-3xl font-black text-zinc-950 tracking-tight">
                        Start today’s practice
                      </h3>
                      <p className="text-sm font-bold text-zinc-500 tracking-wide">
                        Choose practice mode
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-600 font-black uppercase tracking-widest text-[10px] hidden sm:block">
                        Choose mode
                      </span>
                      <div className="rounded-2xl bg-zinc-950 text-white p-4 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:translate-x-1">
                        <ChevronRight className="h-8 w-8" strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 right-12 rotate-[-12deg] text-zinc-950/5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]">
                    <GiMetronome size={180} />
                  </div>
              </div>
            )}

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">
                    Choose how you want to practice today
                  </h3>
                  <NavigationCards />
                </div>
          </div>

          <div>
            <DashboardSection compact>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <ActiveChallengeWidget />
                <DailyQuestWidget />
              </div>
            </DashboardSection>
          </div>

          <ActivityLogView 
            year={year}
            setYear={setYear}
            datasWithReports={datasWithReports}
            isLoading={isLoading}
          />

          {featSlot && featSlot}
        </div>
      )}

      {activeTab === "review" && (
        <>
          <DashboardSection compact>
            <StatsSection
              statsField={statsField}
              statistics={userStats}
              datasWithReports={datasWithReports}
              userSongs={songs}
              onSongsChange={refreshSongs}
              userAuth={userAuth}
              achievements={achievements}
              year={year}
              setYear={setYear}
              isLoadingActivity={isLoading}
              mode="review"
            />
          </DashboardSection>
        </>
      )}
    </DashboardContainer>
  );
};

export default ProfileLandingLayout;
