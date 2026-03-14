import { HeroBanner } from "components/UI/HeroBanner";
import { ExercisePlan } from "feature/exercisePlan/components/ExercisePlan";
import { cn } from "assets/lib/utils";
import AppLayout from "layouts/AppLayout";
import { Music, Zap } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import type { NextPageWithLayout } from "types/page";

const TABS = [
  { id: "routines", label: "Routines", icon: Music },
  { id: "playalongs", label: "Playalongs", icon: Zap },
] as const;

const ProfileExercisesPage: NextPageWithLayout = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("routines");

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      {!sessionActive && (
        <>
          <HeroBanner
            title="Exercises"
            subtitle="Build your skills with focused practice exercises"
            eyebrow="Exercise Hub"
            className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
          >
            <div className="flex items-center gap-2 p-1 bg-zinc-900 rounded-lg w-fit border border-white/5 mt-4">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all",
                    activeTab === id
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </HeroBanner>
        </>
      )}
      <ExercisePlan hideLayout onSessionChange={setSessionActive} controlledTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

ProfileExercisesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"profile"}
      subtitle="Exercises"
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ProfileExercisesPage;


