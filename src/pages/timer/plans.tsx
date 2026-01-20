import MainContainer from "components/MainContainer";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
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
  const userAuth = useAppSelector(selectUserAuth);
  const [isFinishing, setIsFinishing] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomPlans = async () => {
      if (!userAuth) return;
      
      try {
        const plans = await getUserExercisePlans(userAuth);
        setCustomPlans(plans);
      } catch (error) {
        console.error("Failed to load custom plans:", error);
      }
    };

    loadCustomPlans();
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
    } else {
      router.push("/timer");
    }
  };

  const handlePlanSelect = (planId: string) => {
    const allPlans = [...defaultPlans, ...customPlans];
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
      <PracticeSession plan={selectedPlan} onFinish={handlePlanFinish} isFinishing={isFinishing} autoReport={true} />
    </MainContainer>
  ) : (
    <PlanSelector onBack={handleBack} onSelectPlan={handlePlanSelect} loadingPlanId={loadingPlanId} />
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
