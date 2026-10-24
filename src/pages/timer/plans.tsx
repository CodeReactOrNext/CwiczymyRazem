import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import MainContainer from "components/MainContainer";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { usePublicExercisePlans, useUserExercisePlans } from "feature/exercisePlan/hooks/useExercisePlans";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PlanSelector } from "feature/practice/views/PlanSelector/PlanSelector";
import { selectUserAuth } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect,useRef,useState } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

// The session player (alphaTab, Tone, pitch detection…) is several MB of JS that
// the plan list never needs. Imported statically it was part of this page's
// first load and the list waited for all of it; now it is fetched on demand and
// warmed up in the background once the list is on screen.
const loadPracticeSession = () =>
  import("feature/exercisePlan/views/PracticeSession/PracticeSession").then(
    (m) => m.PracticeSession
  );
const PracticeSession = dynamic(loadPracticeSession, { ssr: false });

const TimerPlans: NextPageWithLayout = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);
  const userAuth = useAppSelector(selectUserAuth);
  const { data: customPlans } = useUserExercisePlans(userAuth);
  const { data: communityPlans } = usePublicExercisePlans(!!userAuth);
  const [isFinishing, setIsFinishing] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  // Tracks whether *this page* pushed the `planId` history entry (list -> session),
  // so handleBack knows to pop it (browser-back-like) instead of stripping the
  // query on deep-linked sessions (?planId= opened directly from another page).
  const pushedPlanIdRef = useRef(false);

  useEffect(() => {
    loadPracticeSession();
  }, []);

  const handlePlanSelect = async (planId: string) => {
    const allPlans = [...defaultPlans, ...(customPlans ?? []), ...(communityPlans ?? [])];
    const plan = allPlans.find((p) => p.id === planId);
    if (plan) {
      setLoadingPlanId(planId);
      // Usually already warm from the preload on mount; on a cold click the card
      // spinner covers the download instead of a blank screen.
      await loadPracticeSession();
      setSelectedPlan(plan);
      setLoadingPlanId(null);
    }
  };

  useEffect(() => {
    if (router.isReady && router.query.planId) {
      const planId = router.query.planId as string;
      // A background refetch of the plan lists must not swap the plan object
      // under a running session.
      if (selectedPlan?.id === planId) return;
      handlePlanSelect(planId);
    }
  }, [router.isReady, router.query.planId, customPlans, communityPlans]);

  const handleBack = () => {
    if (selectedPlan) {
      if (pushedPlanIdRef.current) {
        // We pushed a history entry when opening this session from the list -
        // popping it lands back on the list, same as the browser Back button.
        pushedPlanIdRef.current = false;
        router.back();
        return;
      }
      setSelectedPlan(null);
      // The session may have been auto-opened from ?planId= (Last Session
      // shortcut, favorites, daily quest) without us pushing that entry.
      // Drop the param on exit instead, otherwise a refresh or the next
      // router event reopens the session immediately.
      if (router.query.planId) {
        const restQuery = { ...router.query };
        delete restQuery.planId;
        router.replace({ query: restQuery }, undefined, { shallow: true });
      }
    } else {
      router.push("/timer");
    }
  };

  const handleSelectPlanFromList = (planId: string) => {
    // Push (not replace) so the browser's Back button returns here, to the
    // list, instead of leaving /timer/plans entirely.
    pushedPlanIdRef.current = true;
    router.push(
      { pathname: router.pathname, query: { ...router.query, planId } },
      undefined,
      { shallow: true }
    );
  };

  const handlePlanFinish = () => {
    setIsFinishing(true);
    router.push("/report");
  };

  // Require both the query param and the loaded plan so that losing
  // ?planId= (browser back/forward, or handleBack stripping it) hides the
  // session immediately, without needing an effect to reset `selectedPlan`.
  return router.query.planId && selectedPlan ? (
    <MainContainer>
      <PracticeSession plan={selectedPlan} onClose={handleBack} onFinish={handlePlanFinish} isFinishing={isFinishing} autoReport={true} />
    </MainContainer>
  ) : (
    <div className="bg-second-600 rounded-lg overflow-visible flex flex-col border-none min-h-screen ">
      <HeroBanner
        title="Practice Routines"
        subtitle="Build your skills with focused practice exercises"
        eyebrowContent={
          <Breadcrumbs
            items={[{ label: "Practice", href: "/timer" }, { label: "Routines" }]}
          />
        }
        backgroundContent={<HeroPattern />}
        className="w-full !rounded-none !shadow-none"
      />
      <PlanSelector onSelectPlan={handleSelectPlanFromList} loadingPlanId={loadingPlanId} />
    </div>
  );
};

TimerPlans.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default TimerPlans;

TimerPlans.getInitialProps = withAuthInitialProps();
