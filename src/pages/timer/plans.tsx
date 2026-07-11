import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import MainContainer from "components/MainContainer";
import { HeroBanner } from "components/UI/HeroBanner";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getPublicExercisePlans } from "feature/exercisePlan/services/getPublicExercisePlans";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { PlanSelector } from "feature/practice/views/PlanSelector/PlanSelector";
import { selectUserAuth } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect,useState } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const TimerPlans: NextPageWithLayout = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);
  const [customPlans, setCustomPlans] = useState<ExercisePlan[]>([]);
  const [communityPlans, setCommunityPlans] = useState<ExercisePlan[]>([]);
  const userAuth = useAppSelector(selectUserAuth);
  const [isFinishing, setIsFinishing] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      if (!userAuth) return;
      try {
        const [userPlans, publicPlans] = await Promise.all([
          getUserExercisePlans(userAuth),
          getPublicExercisePlans(),
        ]);
        setCustomPlans(userPlans);
        setCommunityPlans(publicPlans);
      } catch (error) {
        console.error("Failed to load plans:", error);
      }
    };

    loadPlans();
  }, [userAuth]);

  useEffect(() => {
    if (router.isReady && router.query.planId) {
      const planId = router.query.planId as string;
      handlePlanSelect(planId);
    }
  }, [router.isReady, router.query.planId, customPlans]);

  const handleBack = () => {
    if (selectedPlan) {
      setSelectedPlan(null);
      // The session may have been auto-opened from ?planId= (Last Session
      // shortcut, favorites, daily quest). Drop the param on exit, otherwise
      // a refresh or the next router event reopens the session immediately.
      if (router.query.planId) {
        const restQuery = { ...router.query };
        delete restQuery.planId;
        router.replace({ query: restQuery }, undefined, { shallow: true });
      }
    } else {
      router.push("/timer");
    }
  };

  const handlePlanSelect = (planId: string) => {
    const allPlans = [...defaultPlans, ...customPlans, ...communityPlans];
    const plan = allPlans.find((p) => p.id === planId);
    if (plan) {
      setLoadingPlanId(planId);
      setTimeout(() => {
        setSelectedPlan(plan);
        setLoadingPlanId(null);
      }, 500);
    }
  };

  const handlePlanFinish = () => {
    setIsFinishing(true);
    router.push("/report");
  };

  return selectedPlan ? (
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
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
      />
      <PlanSelector onSelectPlan={handlePlanSelect} loadingPlanId={loadingPlanId} />
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

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises", "report", "achievements",'rating_popup'],
});
