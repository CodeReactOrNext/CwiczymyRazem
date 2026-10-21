import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import MainContainer from "components/MainContainer";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { statisticsInitial } from "constants/userStatisticsInitialData";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { PracticeModeSelector } from "feature/practice/components/PracticeModeSelector/PracticeModeSelector";
import { AutoPlanGenerator } from "feature/practice/views/AutoPlanGenerator/AutoPlanGenerator";
import { setUserRole } from "feature/user/store/userSlice";
import { changeUserDisplayName } from "feature/user/store/userSlice.asyncThunk";
import MainLoggedLayout from "layouts/MainLoggedLayout/MainLoggedLayout";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useAppDispatch } from "store/hooks";

/**
 * Dev-only harness for screen-recording the Auto Plan flow (practice hub →
 * Auto Plan → generated plan → session) without Firebase auth. Mirrors
 * /timer and /timer/auto; the hub's push to /timer/auto is caught and swapped
 * for the Auto Plan view in place. Renders nothing outside development.
 * Recorded by a Playwright CDP screencast for the promo reels.
 */
type View = "hub" | "auto" | "session";

export default function AutoPlanRecordingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [view, setView] = useState<View>("hub");
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    dispatch(changeUserDisplayName.fulfilled("Riffer", "dev", "Riffer"));
    dispatch(setUserRole("master"));
  }, [dispatch]);

  // A real route change lands at the top; the app shell scrolls its own pane.
  useLayoutEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-app-shell] *").forEach((el) => {
      if (el.scrollTop > 0) el.scrollTop = 0;
    });
  }, [view]);

  // Stand in for /timer and /timer/auto, so the nav highlights Practice and
  // the hub's push to Auto Plan swaps the view instead of leaving the page.
  const appRouter = useMemo(() => {
    const path = view === "hub" ? "/timer" : "/timer/auto";
    return {
      ...router,
      pathname: path,
      asPath: path,
      push: async (href: string) => {
        if (href.startsWith("/timer/auto")) setView("auto");
        else if (href === "/timer") setView("hub");
        return true;
      },
    };
  }, [router, view]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (view === "session" && plan) {
    return (
      <MainContainer>
        <PracticeSession
          plan={plan}
          onClose={() => setView("auto")}
          onFinish={() => { /* dev harness — no report */ }}
          isFinishing={false}
        />
      </MainContainer>
    );
  }

  return (
    <RouterContext.Provider value={appRouter as typeof router}>
    <MainLoggedLayout
      pageId='exercise'
      variant='secondary'
      userStats={statisticsInitial}
      userName='Riffer'>
      {view === "hub" ? (
        <div className='flex flex-col w-full h-full'>
          <PracticeModeSelector />
        </div>
      ) : (
        <div className='bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen '>
          <HeroBanner
            title='Auto Plan'
            subtitle='Automatically generated practice session'
            eyebrowContent={
              <Breadcrumbs
                items={[
                  { label: "Practice", href: "/timer" },
                  { label: "Auto Plan" },
                ]}
              />
            }
            backgroundContent={<HeroPattern withShuffle />}
            compact
            className='w-full !rounded-none !shadow-none'
          />
          <AutoPlanGenerator
            onBack={() => setView("hub")}
            onSelectPlan={(next) => {
              setIsStarting(true);
              setTimeout(() => {
                setPlan(next);
                setView("session");
                setIsStarting(false);
              }, 500);
            }}
            isStarting={isStarting}
          />
        </div>
      )}
    </MainLoggedLayout>
    </RouterContext.Provider>
  );
}
