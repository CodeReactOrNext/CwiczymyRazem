import { PlanSelector } from "feature/practice/views/PlanSelector/PlanSelector";
import { NextPage } from "next";
import { useRouter } from "next/router";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { useState } from "react";
import MainContainer from "components/MainContainer";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";

const TimerPlans: NextPage = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);

  const handleBack = () => {
    if (selectedPlan) {
      setSelectedPlan(null);
    } else {
      router.push("/timer");
    }
  };

  const handlePlanSelect = (planId: string) => {
    const plan = defaultPlans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    }
  };

  const handlePlanFinish = () => {
    setSelectedPlan(null);
    router.push("/report");
  };

  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {selectedPlan ? (
        <MainContainer>
          <PracticeSession plan={selectedPlan} onFinish={handlePlanFinish} />
        </MainContainer>
      ) : (
        <PlanSelector onBack={handleBack} onSelectPlan={handlePlanSelect} />
      )}
    </AppLayout>
  );
};

export default TimerPlans;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises"],
});
